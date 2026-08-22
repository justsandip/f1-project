import { describe, expect, it } from '@jest/globals';
import { Lap } from '@/app/laps/entities/lap.entity';
import { CarDataSample } from '@/app/telemetry/entities/car-data-sample.entity';
import { LocationSample } from '@/app/telemetry/entities/location-sample.entity';
import { mergeTelemetry } from '@/app/replay/replay-merge';

const lapStartMs = Date.parse('2024-07-07T15:09:13.478Z');

function lap(lapDuration: number): Lap {
  return new Lap({
    sessionKey: 9558,
    driverNumber: 44,
    lapNumber: 42,
    meetingKey: 1240,
    dateStart: new Date(lapStartMs),
    durationSector1: 1,
    durationSector2: 1,
    durationSector3: 1,
    i1Speed: null,
    i2Speed: 1,
    isPitOutLap: false,
    lapDuration,
    segmentsSector1: null,
    segmentsSector2: null,
    segmentsSector3: null,
    stSpeed: 1,
  });
}

function carSample(
  offsetMs: number,
  overrides: Partial<CarDataSample> = {},
): CarDataSample {
  return new CarDataSample({
    sessionKey: 9558,
    driverNumber: 44,
    meetingKey: 1240,
    date: new Date(lapStartMs + offsetMs),
    rpm: 10000,
    speed: 250,
    nGear: 6,
    throttle: 100,
    brake: 0,
    drs: 0,
    ...overrides,
  });
}

function locationSample(
  offsetMs: number,
  overrides: Partial<LocationSample> = {},
): LocationSample {
  return new LocationSample({
    sessionKey: 9558,
    driverNumber: 44,
    meetingKey: 1240,
    date: new Date(lapStartMs + offsetMs),
    x: 0,
    y: 0,
    z: 0,
    ...overrides,
  });
}

describe('mergeTelemetry', () => {
  it('joins each car_data sample with its nearest location sample by timestamp', () => {
    const carData = [carSample(1000, { speed: 200 })];
    const location = [
      locationSample(700, { x: 10, y: 10 }),
      locationSample(1100, { x: 20, y: 20 }),
    ];

    const [sample] = mergeTelemetry(lap(10), carData, location);

    expect(sample.x).toBe(20);
    expect(sample.y).toBe(20);
    expect(sample.speed).toBe(200);
  });

  it('computes elapsedMs and progress relative to lap start', () => {
    const carData = [carSample(2500)];
    const location = [locationSample(2500)];

    const [sample] = mergeTelemetry(lap(10), carData, location);

    expect(sample.elapsedMs).toBe(2500);
    expect(sample.progress).toBeCloseTo(0.25);
  });

  it('drops samples outside the lap window', () => {
    const carData = [
      carSample(-500), // before lap start
      carSample(5000), // within lap
      carSample(10500), // after lap end (lapDuration=10s -> 10000ms)
    ];
    const location = [
      locationSample(-500),
      locationSample(5000),
      locationSample(10500),
    ];

    const samples = mergeTelemetry(lap(10), carData, location);

    expect(samples).toHaveLength(1);
    expect(samples[0].elapsedMs).toBe(5000);
  });

  it('returns an empty array when there is no car_data', () => {
    expect(mergeTelemetry(lap(10), [], [locationSample(0)])).toEqual([]);
  });

  it('throws when car_data exists but location is empty', () => {
    expect(() => mergeTelemetry(lap(10), [carSample(0)], [])).toThrow(
      'Cannot merge telemetry: no location samples available',
    );
  });

  it('produces samples in chronological order even if input is unsorted', () => {
    const carData = [carSample(5000), carSample(1000), carSample(3000)];
    const location = [locationSample(0), locationSample(10000)];

    const samples = mergeTelemetry(lap(10), carData, location);

    expect(samples.map((s) => s.elapsedMs)).toEqual([1000, 3000, 5000]);
  });
});
