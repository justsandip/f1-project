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
  @Column('timestamptz', { nullable: true })
  dateStart: Date | null;

  /** The time taken, in seconds, to complete the first sector of the lap. */
  @Column('float', { nullable: true })
  durationSector1: number | null;

  /** The time taken, in seconds, to complete the second sector of the lap. */
  @Column('float', { nullable: true })
  durationSector2: number | null;

  /** The time taken, in seconds, to complete the third sector of the lap. */
  @Column('float', { nullable: true })
  durationSector3: number | null;

  /** The speed, in km/h, at the first intermediate point of the lap. */
  @Column('int', { nullable: true })
  i1Speed: number | null;

  /** The speed, in km/h, at the second intermediate point of the lap. */
  @Column('int', { nullable: true })
  i2Speed: number | null;

  /** Whether this lap is an outlap from the pits. */
  @Column('boolean')
  isPitOutLap: boolean;

  /** The total time taken, in seconds, to complete the lap. */
  @Column('float', { nullable: true })
  lapDuration: number | null;

  /** Segment status codes for the first sector, used to render mini-sector colours. */
  @Column('int', { array: true, nullable: true })
  segmentsSector1: number[] | null;

  /** Segment status codes for the second sector, used to render mini-sector colours. */
  @Column('int', { array: true, nullable: true })
  segmentsSector2: number[] | null;

  /** Segment status codes for the third sector, used to render mini-sector colours. */
  @Column('int', { array: true, nullable: true })
  segmentsSector3: number[] | null;

  /** The speed, in km/h, at the speed trap. */
  @Column('int', { nullable: true })
  stSpeed: number | null;

  constructor(data: Partial<Lap>) {
    Object.assign(this, data);
  }
}
