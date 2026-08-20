import { Column, Entity, PrimaryColumn } from 'typeorm';

/** A driver's identity and team info as it applies to one specific session
 * (a driver's team/livery can change between sessions across a season). */
@Entity('drivers')
export class Driver {
  /** The unique identifier for the session this driver record belongs to. */
  @PrimaryColumn('int')
  sessionKey: number;

  /** The unique number assigned to the driver, e.g. 44. */
  @PrimaryColumn('int')
  driverNumber: number;

  /** The unique identifier for the meeting this session belongs to. */
  @Column('int')
  meetingKey: number;

  /** The driver's name as displayed on TV broadcasts, e.g. "L HAMILTON". */
  @Column('varchar')
  broadcastName: string;

  /** The driver's full name, e.g. "Lewis HAMILTON". */
  @Column('varchar')
  fullName: string;

  /** A three-letter acronym for the driver's name, e.g. "HAM". */
  @Column('varchar', { length: 3 })
  nameAcronym: string;

  /** The name of the driver's team, e.g. "Mercedes". */
  @Column('varchar')
  teamName: string;

  /** The hexadecimal colour value of the driver's team, without the leading "#". */
  @Column('varchar', { length: 6 })
  teamColour: string;

  /** The driver's first name. */
  @Column('varchar')
  firstName: string;

  /** The driver's last name. */
  @Column('varchar')
  lastName: string;

  /** A URL to a headshot image of the driver. */
  @Column('text', { nullable: true })
  headshotUrl: string | null;

  /** A code that uniquely identifies the driver's country. */
  @Column('varchar', { length: 3 })
  countryCode: string;

  constructor(data: Partial<Driver>) {
    Object.assign(this, data);
  }
}
