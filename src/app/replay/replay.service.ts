import { Injectable, NotFoundException } from '@nestjs/common';
import { OpenF1Client } from '@/app/ingestion/openf1-client.service';
import { mergeTelemetry, ReplaySample } from '@/app/replay/replay-merge';

export interface ReplayResponse {
  sessionKey: number;
  driverNumber: number;
  lapNumber: number;
  lapDuration: number;
  samples: ReplaySample[];
}

/** Padding added either side of a lap's own time window when fetching
 * telemetry, so nearest-timestamp joins have coverage right up to the
 * lap boundaries. Samples outside [0, lapDuration] are dropped by the
 * merge itself, so this never leaks into the replay output. */
const TELEMETRY_WINDOW_BUFFER_MS = 2000;

/** Builds a lap's replay payload. Currently fetches lap/car_data/location
 * live from OpenF1 via OpenF1Client — once ingestion + Postgres land, this
 * swaps to reading the same data from repositories instead. The merge
 * logic and the response shape stay the same either way. */
@Injectable()
export class ReplayService {
  constructor(private readonly openF1Client: OpenF1Client) {}

  async getReplay(
    sessionKey: number,
    driverNumber: number,
    lapNumber: number,
  ): Promise<ReplayResponse> {
    const laps = await this.openF1Client.getLaps(sessionKey, driverNumber);
    const lap = laps.find((candidate) => candidate.lapNumber === lapNumber);
    if (!lap) {
      throw new NotFoundException(
        `No lap ${lapNumber} found for session_key=${sessionKey}, driver_number=${driverNumber}`,
      );
    }

    const from = new Date(lap.dateStart.getTime() - TELEMETRY_WINDOW_BUFFER_MS);
    const to = new Date(
      lap.dateStart.getTime() +
        lap.lapDuration * 1000 +
        TELEMETRY_WINDOW_BUFFER_MS,
    );

    const [carData, location] = await Promise.all([
      this.openF1Client.getCarData(sessionKey, driverNumber, from, to),
      this.openF1Client.getLocation(sessionKey, driverNumber, from, to),
    ]);

    return {
      sessionKey: lap.sessionKey,
      driverNumber: lap.driverNumber,
      lapNumber: lap.lapNumber,
      lapDuration: lap.lapDuration,
      samples: mergeTelemetry(lap, carData, location),
    };
  }
}
