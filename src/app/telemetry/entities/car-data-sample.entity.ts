import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/** A single car telemetry sample (~3.7Hz) for one driver during a session. */
@Entity('car_data')
@Index(['sessionKey', 'driverNumber', 'date'], { unique: true })
export class CarDataSample {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  /** The unique identifier for the session this sample belongs to. */
  @Column('int')
  sessionKey: number;

  /** The unique number assigned to the driver, e.g. 44. */
  @Column('int')
  driverNumber: number;

  /** The unique identifier for the meeting this session belongs to. */
  @Column('int')
  meetingKey: number;

  /** The UTC date and time at which the sample was recorded. */
  @Column('timestamptz')
  date: Date;

  /** Revolutions per minute of the engine. */
  @Column('int')
  rpm: number;

  /** Speed of the car, in km/h. */
  @Column('int')
  speed: number;

  /** Current gear selected, from 0 (neutral) to 8. */
  @Column('int')
  nGear: number;

  /** Percentage of maximum throttle applied (0-100). */
  @Column('int')
  throttle: number;

  /** Whether the brake is applied (0 or 100). */
  @Column('int')
  brake: number;

  /** DRS status code (0/1 = closed, 8/10/12/14 = open, varies by generation). */
  @Column('int')
  drs: number;

  constructor(data: Partial<CarDataSample>) {
    Object.assign(this, data);
  }
}
