import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Meeting } from '@/app/meetings/entities/meeting.entity';
import { Session } from '@/app/sessions/entities/session.entity';
import { Driver } from '@/app/drivers/entities/driver.entity';
import { Lap } from '@/app/laps/entities/lap.entity';
import { CarDataSample } from '@/app/telemetry/entities/car-data-sample.entity';
import { LocationSample } from '@/app/telemetry/entities/location-sample.entity';
import {
  RawCarDataSample,
  RawDriver,
  RawLap,
  RawLocationSample,
  RawMeeting,
  RawSession,
} from '@/app/ingestion/openf1.types';

/** Thin wrapper around OpenF1's REST API. Fetches raw JSON and maps it onto
 * our camelCase domain entities; does not touch the database. */
@Injectable()
export class OpenF1Client {
  private readonly baseUrl: string;

  constructor(configService: ConfigService) {
    this.baseUrl = configService.getOrThrow<string>('OPENF1_BASE_URL');
  }

  async getMeeting(meetingKey: number): Promise<Meeting> {
    const [raw] = await this.get<RawMeeting>('/meetings', {
      meeting_key: meetingKey,
    });
    if (!raw) {
      throw new NotFoundException(
        `No meeting found for meeting_key=${meetingKey}`,
      );
    }

    return new Meeting({
      meetingKey: raw.meeting_key,
      meetingName: raw.meeting_name,
      meetingOfficialName: raw.meeting_official_name,
      location: raw.location,
      countryKey: raw.country_key,
      countryCode: raw.country_code,
      countryName: raw.country_name,
      countryFlag: raw.country_flag,
      circuitKey: raw.circuit_key,
      circuitShortName: raw.circuit_short_name,
      circuitType: raw.circuit_type,
      circuitInfoUrl: raw.circuit_info_url,
      circuitImage: raw.circuit_image,
      gmtOffset: raw.gmt_offset,
      dateStart: new Date(raw.date_start),
      dateEnd: new Date(raw.date_end),
      year: raw.year,
      isCancelled: raw.is_cancelled,
    });
  }

  async getSession(sessionKey: number): Promise<Session> {
    const [raw] = await this.get<RawSession>('/sessions', {
      session_key: sessionKey,
    });
    if (!raw) {
      throw new NotFoundException(
        `No session found for session_key=${sessionKey}`,
      );
    }

    return new Session({
      sessionKey: raw.session_key,
      meetingKey: raw.meeting_key,
      sessionType: raw.session_type,
      sessionName: raw.session_name,
      dateStart: new Date(raw.date_start),
      dateEnd: new Date(raw.date_end),
      circuitKey: raw.circuit_key,
      circuitShortName: raw.circuit_short_name,
      countryKey: raw.country_key,
      countryCode: raw.country_code,
      countryName: raw.country_name,
      location: raw.location,
      gmtOffset: raw.gmt_offset,
      year: raw.year,
      isCancelled: raw.is_cancelled,
    });
  }

  async getDriver(sessionKey: number, driverNumber: number): Promise<Driver> {
    const [raw] = await this.get<RawDriver>('/drivers', {
      session_key: sessionKey,
      driver_number: driverNumber,
    });
    if (!raw) {
      throw new NotFoundException(
        `No driver found for session_key=${sessionKey}, driver_number=${driverNumber}`,
      );
    }

    return new Driver({
      sessionKey: raw.session_key,
      driverNumber: raw.driver_number,
      meetingKey: raw.meeting_key,
      broadcastName: raw.broadcast_name,
      fullName: raw.full_name,
      nameAcronym: raw.name_acronym,
      teamName: raw.team_name,
      teamColour: raw.team_colour,
      firstName: raw.first_name,
      lastName: raw.last_name,
      headshotUrl: raw.headshot_url,
      countryCode: raw.country_code,
    });
  }

  async getLaps(sessionKey: number, driverNumber: number): Promise<Lap[]> {
    const raw = await this.get<RawLap>('/laps', {
      session_key: sessionKey,
      driver_number: driverNumber,
    });

    return raw.map(
      (lap) =>
        new Lap({
          sessionKey: lap.session_key,
          driverNumber: lap.driver_number,
          lapNumber: lap.lap_number,
          meetingKey: lap.meeting_key,
          dateStart: new Date(lap.date_start),
          durationSector1: lap.duration_sector_1,
          durationSector2: lap.duration_sector_2,
          durationSector3: lap.duration_sector_3,
          i1Speed: lap.i1_speed,
          i2Speed: lap.i2_speed,
          isPitOutLap: lap.is_pit_out_lap,
          lapDuration: lap.lap_duration,
          segmentsSector1: lap.segments_sector_1,
          segmentsSector2: lap.segments_sector_2,
          segmentsSector3: lap.segments_sector_3,
          stSpeed: lap.st_speed,
        }),
    );
  }

  async getCarData(
    sessionKey: number,
    driverNumber: number,
    from: Date,
    to: Date,
  ): Promise<CarDataSample[]> {
    const raw = await this.get<RawCarDataSample>('/car_data', {
      session_key: sessionKey,
      driver_number: driverNumber,
      'date>': from.toISOString(),
      'date<': to.toISOString(),
    });

    return raw.map(
      (sample) =>
        new CarDataSample({
          sessionKey: sample.session_key,
          driverNumber: sample.driver_number,
          meetingKey: sample.meeting_key,
          date: new Date(sample.date),
          rpm: sample.rpm,
          speed: sample.speed,
          nGear: sample.n_gear,
          throttle: sample.throttle,
          brake: sample.brake,
          drs: sample.drs,
        }),
    );
  }

  async getLocation(
    sessionKey: number,
    driverNumber: number,
    from: Date,
    to: Date,
  ): Promise<LocationSample[]> {
    const raw = await this.get<RawLocationSample>('/location', {
      session_key: sessionKey,
      driver_number: driverNumber,
      'date>': from.toISOString(),
      'date<': to.toISOString(),
    });

    return raw.map(
      (sample) =>
        new LocationSample({
          sessionKey: sample.session_key,
          driverNumber: sample.driver_number,
          meetingKey: sample.meeting_key,
          date: new Date(sample.date),
          x: sample.x,
          y: sample.y,
          z: sample.z,
        }),
    );
  }

  private async get<T>(
    path: string,
    params: Record<string, string | number>,
  ): Promise<T[]> {
    const url = new URL(this.baseUrl + path);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value));
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `OpenF1 request failed: ${response.status} ${response.statusText} (${url})`,
      );
    }

    return (await response.json()) as T[];
  }
}
