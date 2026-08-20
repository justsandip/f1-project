import { Column, Entity, PrimaryColumn } from 'typeorm';

/** A session refers to a distinct period of a meeting (practice, qualifying,
 * race, ...) and belongs to exactly one meeting. */
@Entity('sessions')
export class Session {
  /** The unique identifier for the session. */
  @PrimaryColumn('int')
  sessionKey: number;

  /** The unique identifier for the meeting this session belongs to. */
  @Column('int')
  meetingKey: number;

  /** The type of the session ("Practice", "Qualifying", "Race", ...). */
  @Column('varchar')
  sessionType: string;

  /** The name of the session, e.g. "Race", "Sprint", "Qualifying 1". */
  @Column('varchar')
  sessionName: string;

  /** The UTC starting date and time of the session. */
  @Column('timestamptz')
  dateStart: Date;

  /** The UTC ending date and time of the session. */
  @Column('timestamptz')
  dateEnd: Date;

  /** The unique identifier for the circuit where the session takes place. */
  @Column('int')
  circuitKey: number;

  /** The short or common name of the circuit where the session takes place. */
  @Column('varchar')
  circuitShortName: string;

  /** The unique identifier for the country where the session takes place. */
  @Column('int')
  countryKey: number;

  /** A code that uniquely identifies the country. */
  @Column('varchar', { length: 3 })
  countryCode: string;

  /** The full name of the country where the session takes place. */
  @Column('varchar')
  countryName: string;

  /** The city or geographical location where the session takes place. */
  @Column('varchar')
  location: string;

  /** The difference between local time at the session and GMT, e.g. "01:00:00". */
  @Column('varchar')
  gmtOffset: string;

  /** The year the session takes place. */
  @Column('int')
  year: number;

  /** Whether the session has been cancelled. */
  @Column('boolean')
  isCancelled: boolean;

  constructor(data: Partial<Session>) {
    Object.assign(this, data);
  }
}
