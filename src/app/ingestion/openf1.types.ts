/** Raw JSON shapes returned by OpenF1, before mapping to our camelCase domain entities. */

export interface RawMeeting {
  meeting_key: number;
  meeting_name: string;
  meeting_official_name: string;
  location: string;
  country_key: number;
  country_code: string;
  country_name: string;
  country_flag: string;
  circuit_key: number;
  circuit_short_name: string;
  circuit_type: string;
  circuit_info_url: string;
  circuit_image: string;
  gmt_offset: string;
  date_start: string;
  date_end: string;
  year: number;
  is_cancelled: boolean;
}

export interface RawSession {
  session_key: number;
  meeting_key: number;
  session_type: string;
  session_name: string;
  date_start: string;
  date_end: string;
  circuit_key: number;
  circuit_short_name: string;
  country_key: number;
  country_code: string;
  country_name: string;
  location: string;
  gmt_offset: string;
  year: number;
  is_cancelled: boolean;
}

export interface RawDriver {
  session_key: number;
  meeting_key: number;
  driver_number: number;
  broadcast_name: string;
  full_name: string;
  name_acronym: string;
  team_name: string;
  team_colour: string;
  first_name: string;
  last_name: string;
  headshot_url: string | null;
  country_code: string;
}

export interface RawLap {
  session_key: number;
  meeting_key: number;
  driver_number: number;
  lap_number: number;
  date_start: string;
  duration_sector_1: number;
  duration_sector_2: number;
  duration_sector_3: number;
  /** Occasionally missed by the speed-trap sensor. */
  i1_speed: number | null;
  i2_speed: number;
  is_pit_out_lap: boolean;
  lap_duration: number;
  /** Individual elements are occasionally null when telemetry briefly drops out. */
  segments_sector_1: (number | null)[] | null;
  segments_sector_2: (number | null)[] | null;
  segments_sector_3: (number | null)[] | null;
  st_speed: number;
}

export interface RawCarDataSample {
  session_key: number;
  meeting_key: number;
  driver_number: number;
  date: string;
  rpm: number;
  speed: number;
  n_gear: number;
  throttle: number;
  brake: number;
  drs: number;
}

export interface RawLocationSample {
  session_key: number;
  meeting_key: number;
  driver_number: number;
  date: string;
  x: number;
  y: number;
  z: number;
}
