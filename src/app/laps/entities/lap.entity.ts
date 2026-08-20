import { Column, Entity, PrimaryColumn } from 'typeorm';

/** Timing data for a single lap driven by a driver during a session. */
@Entity('laps')
export class Lap {
  /** The unique identifier for the session this lap belongs to. */
  @PrimaryColumn('int')
  sessionKey: number;

  /** The unique number assigned to the driver, e.g. 44. */
  @PrimaryColumn('int')
  driverNumber: number;

  /** The sequential number of the lap within the session. */
  @PrimaryColumn('int')
  lapNumber: number;

  /** The unique identifier for the meeting this session belongs to. */
  @Column('int')
  meetingKey: number;

  /** The UTC date and time at the start of the lap. */
  @Column('timestamptz')
  dateStart: Date;

  /** The time taken, in seconds, to complete the first sector of the lap. */
  @Column('float')
  durationSector1: number;

  /** The time taken, in seconds, to complete the second sector of the lap. */
  @Column('float')
  durationSector2: number;

  /** The time taken, in seconds, to complete the third sector of the lap. */
  @Column('float')
  durationSector3: number;

  /** The speed, in km/h, at the first intermediate point of the lap. Occasionally
   * missed by the speed-trap sensor. */
  @Column('int', { nullable: true })
  i1Speed: number | null;

  /** The speed, in km/h, at the second intermediate point of the lap. */
  @Column('int')
  i2Speed: number;

  /** Whether this lap is an outlap from the pits. */
  @Column('boolean')
  isPitOutLap: boolean;

  /** The total time taken, in seconds, to complete the lap. */
  @Column('float')
  lapDuration: number;

  /** Segment status codes for the first sector, used to render mini-sector colours.
   * Individual elements are occasionally null when telemetry briefly drops out. */
  @Column('int', { array: true, nullable: true })
  segmentsSector1: (number | null)[] | null;

  /** Segment status codes for the second sector, used to render mini-sector colours. */
  @Column('int', { array: true, nullable: true })
  segmentsSector2: (number | null)[] | null;

  /** Segment status codes for the third sector, used to render mini-sector colours. */
  @Column('int', { array: true, nullable: true })
  segmentsSector3: (number | null)[] | null;

  /** The speed, in km/h, at the speed trap. */
  @Column('int')
  stSpeed: number;

  constructor(data: Partial<Lap>) {
    Object.assign(this, data);
  }
}
