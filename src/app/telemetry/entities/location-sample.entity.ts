import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/** A single car position sample (~3.7Hz) for one driver during a session. */
@Entity('location')
@Index(['sessionKey', 'driverNumber', 'date'], { unique: true })
export class LocationSample {
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

  /** The car's X position on track, in the circuit's local coordinate space. */
  @Column('int')
  x: number;

  /** The car's Y position on track, in the circuit's local coordinate space. */
  @Column('int')
  y: number;

  /** The car's Z position on track, in the circuit's local coordinate space. */
  @Column('int')
  z: number;

  constructor(data: Partial<LocationSample>) {
    Object.assign(this, data);
  }
}
