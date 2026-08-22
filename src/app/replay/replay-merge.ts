import { Lap } from '@/app/laps/entities/lap.entity';
import { CarDataSample } from '@/app/telemetry/entities/car-data-sample.entity';
import { LocationSample } from '@/app/telemetry/entities/location-sample.entity';

/** One point in a lap's replay timeline: car_data and location joined by
 * nearest timestamp, with timing normalized relative to the lap's start. */
export interface ReplaySample {
  elapsedMs: number;
  progress: number;
  x: number;
  y: number;
  speed: number;
  gear: number;
  rpm: number;
  throttle: number;
  brake: number;
  drs: number;
}

/** Merges car_data and location — two independently sampled ~3.7Hz feeds
 * that don't share timestamps — into one time-ordered replay sequence.
 * car_data is the base series (it carries the HUD fields); each car_data
 * sample is paired with its nearest location sample by timestamp. Samples
 * outside the lap's own [0, lapDuration] window (e.g. ingestion buffer
 * padding) are dropped so the result is exactly the lap. */
export function mergeTelemetry(
  lap: Lap,
  carData: CarDataSample[],
  location: LocationSample[],
): ReplaySample[] {
  if (carData.length === 0) {
    return [];
  }
  if (location.length === 0) {
    throw new Error('Cannot merge telemetry: no location samples available');
  }

  const sortedCarData = [...carData].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );
  const sortedLocation = [...location].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );

  const lapStartMs = lap.dateStart.getTime();
  const lapDurationMs = lap.lapDuration * 1000;

  const samples: ReplaySample[] = [];
  let locationIndex = 0;

  for (const carSample of sortedCarData) {
    const carSampleMs = carSample.date.getTime();

    while (
      locationIndex < sortedLocation.length - 1 &&
      Math.abs(
        sortedLocation[locationIndex + 1].date.getTime() - carSampleMs,
      ) <= Math.abs(sortedLocation[locationIndex].date.getTime() - carSampleMs)
    ) {
      locationIndex++;
    }

    const elapsedMs = carSampleMs - lapStartMs;
    if (elapsedMs < 0 || elapsedMs > lapDurationMs) {
      continue;
    }

    const nearestLocation = sortedLocation[locationIndex];

    samples.push({
      elapsedMs,
      progress: elapsedMs / lapDurationMs,
      x: nearestLocation.x,
      y: nearestLocation.y,
      speed: carSample.speed,
      gear: carSample.nGear,
      rpm: carSample.rpm,
      throttle: carSample.throttle,
      brake: carSample.brake,
      drs: carSample.drs,
    });
  }

  return samples;
}
