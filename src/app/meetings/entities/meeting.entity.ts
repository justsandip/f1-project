import { Column, Entity, PrimaryColumn } from 'typeorm';

/** A meeting refers to a Grand Prix or testing weekend and usually includes
 * multiple sessions (practice, qualifying, race, ...). */
@Entity('meetings')
export class Meeting {
  /** The unique identifier for the meeting. */
  @PrimaryColumn('int')
  meetingKey: number;

  /** The name of the meeting. */
  @Column('varchar')
  meetingName: string;

  /** The official name of the meeting. */
  @Column('varchar')
  meetingOfficialName: string;

  /** The city or geographical location where the event takes place. */
  @Column('varchar')
  location: string;

  /** The unique identifier for the country where the event takes place. */
  @Column('int')
  countryKey: number;

  /** A code that uniquely identifies the country. */
  @Column('varchar', { length: 3 })
  countryCode: string;

  /** The full name of the country where the event takes place. */
  @Column('varchar')
  countryName: string;

  /** A URL to an image of the country flag. */
  @Column('text')
  countryFlag: string;

  /** The unique identifier for the circuit where the event takes place. */
  @Column('int')
  circuitKey: number;

  /** The short or common name of the circuit where the event takes place. */
  @Column('varchar')
  circuitShortName: string;

  /** The type of the circuit ("Permanent", "Temporary - Street", or "Temporary - Road"). */
  @Column('varchar')
  circuitType: string;

  /** A URL to a JSON containing detailed circuit info. */
  @Column('text')
  circuitInfoUrl: string;

  /** A URL to an image of the circuit. */
  @Column('text')
  circuitImage: string;

  /** The difference between local time at the event and GMT, e.g. "01:00:00". */
  @Column('varchar')
  gmtOffset: string;

  /** The UTC starting date and time of the meeting. */
  @Column('timestamptz')
  dateStart: Date;

  /** The UTC ending date and time of the meeting. */
  @Column('timestamptz')
  dateEnd: Date;

  /** The year the event takes place. */
  @Column('int')
  year: number;

  /** Whether the meeting has been cancelled. */
  @Column('boolean')
  isCancelled: boolean;

  constructor(data: Partial<Meeting>) {
    Object.assign(this, data);
  }
}
