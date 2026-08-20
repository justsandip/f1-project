import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { OpenF1Client } from '@/app/ingestion/openf1-client.service';

type FakeFetchResponse = {
  ok: boolean;
  status?: number;
  statusText?: string;
  json?: () => Promise<unknown>;
};

describe('OpenF1Client', () => {
  let client: OpenF1Client;
  let fetchMock: jest.Mock<(url: string | URL) => Promise<FakeFetchResponse>>;

  beforeEach(() => {
    const configService = {
      getOrThrow: () => 'https://api.openf1.org/v1',
    } as unknown as ConfigService;
    client = new OpenF1Client(configService);

    fetchMock = jest.fn<(url: string | URL) => Promise<FakeFetchResponse>>();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  function mockResponse(body: unknown) {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(body),
    });
  }

  it('maps a raw session to the Session entity', async () => {
    mockResponse([
      {
        session_key: 9558,
        meeting_key: 1240,
        session_type: 'Race',
        session_name: 'Race',
        date_start: '2024-07-07T14:00:00+00:00',
        date_end: '2024-07-07T16:00:00+00:00',
        circuit_key: 2,
        circuit_short_name: 'Silverstone',
        country_key: 2,
        country_code: 'GBR',
        country_name: 'United Kingdom',
        location: 'Silverstone',
        gmt_offset: '01:00:00',
        year: 2024,
        is_cancelled: false,
      },
    ]);

    const session = await client.getSession(9558);

    expect(session.sessionKey).toBe(9558);
    expect(session.circuitShortName).toBe('Silverstone');
    expect(session.dateStart).toEqual(new Date('2024-07-07T14:00:00+00:00'));

    const requestedUrl = new URL(fetchMock.mock.calls[0][0] as string);
    expect(requestedUrl.pathname).toBe('/v1/sessions');
    expect(requestedUrl.searchParams.get('session_key')).toBe('9558');
  });

  it('throws NotFoundException when a single-resource lookup returns no rows', async () => {
    mockResponse([]);

    await expect(client.getSession(9558)).rejects.toThrow(NotFoundException);
  });

  it('maps raw car_data rows to CarDataSample entities and sends date range filters', async () => {
    mockResponse([
      {
        session_key: 9558,
        meeting_key: 1240,
        driver_number: 44,
        date: '2024-07-07T15:09:13.313000+00:00',
        rpm: 10640,
        speed: 258,
        n_gear: 7,
        throttle: 100,
        brake: 0,
        drs: 0,
      },
    ]);

    const from = new Date('2024-07-07T15:09:13.000Z');
    const to = new Date('2024-07-07T15:10:43.000Z');
    const [sample] = await client.getCarData(9558, 44, from, to);

    expect(sample.nGear).toBe(7);
    expect(sample.date).toEqual(new Date('2024-07-07T15:09:13.313000+00:00'));

    const requestedUrl = new URL(fetchMock.mock.calls[0][0] as string);
    expect(requestedUrl.searchParams.get('date>')).toBe(from.toISOString());
    expect(requestedUrl.searchParams.get('date<')).toBe(to.toISOString());
  });

  it('maps a lap with a missing speed-trap reading and a dropped telemetry segment', async () => {
    mockResponse([
      {
        session_key: 9558,
        meeting_key: 1240,
        driver_number: 24,
        lap_number: 9,
        date_start: '2024-07-07T14:15:53.314000+00:00',
        duration_sector_1: 30.439,
        duration_sector_2: 38.755,
        duration_sector_3: 26.128,
        i1_speed: null,
        i2_speed: 253,
        is_pit_out_lap: false,
        lap_duration: 95.322,
        segments_sector_1: [null, 2048, 2048, 2048, 2048, 2048, 2048],
        segments_sector_2: [
          2048, 2048, 2048, 2048, 2048, 2048, 2048, 2048, 2048, 2048,
        ],
        segments_sector_3: [2048, 2048, 2048, 2048, 2048, 2048, 2048, 2048],
        st_speed: 291,
      },
    ]);

    const [lap] = await client.getLaps(9558, 24);

    expect(lap.lapNumber).toBe(9);
    expect(lap.i1Speed).toBeNull();
    expect(lap.segmentsSector1?.[0]).toBeNull();
    expect(lap.lapDuration).toBe(95.322);
    expect(lap.dateStart).toEqual(new Date('2024-07-07T14:15:53.314000+00:00'));
  });

  it('throws when the OpenF1 response is not ok', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(client.getSession(9558)).rejects.toThrow(
      'OpenF1 request failed: 500',
    );
  });
});
