# Adding Time Range Generation to Data Diluvium

Following up on my previous posts about adding humidity and temperature data generation to Data Diluvium, I'm now adding a Time Range generator. This completes the trio of generators I needed for my TimeScale DB setup. While humidity and temperature provide the environmental data, the Time Range generator ensures we have properly spaced time points for our time-series analysis.

## Why Time Range Generation?

When working with TimeScale DB for time-series data, having evenly spaced time points is crucial for accurate analysis. I've found that many of my experiments require data points that are:
- Evenly distributed across a time window
- Properly spaced for consistent analysis
- Flexible enough to handle different sampling rates
- Random in their starting point to avoid bias

## The Implementation

I created a Time Range generator that produces timestamps based on a 2-hour window. Here's what I considered:
- Default 2-hour time window
- Even distribution of points across the window
- Random starting point within a reasonable range
- Support for various numbers of data points

Here's how I implemented this in Data Diluvium:

```typescript
export const timeRangeGenerator: GeneratorConfig = {
  name: 'Time Range',
  description: 'Generates evenly spaced timestamps across a 2-hour window',
  category: 'timestamp',
  compatibleTypes: [
    'TIMESTAMP', 'TIMESTAMP WITH TIME ZONE', 'DATETIME',
    'TIMESTAMP(6)', 'TIMESTAMP(6) WITH TIME ZONE'
  ],
  defaultOptions: {
    windowHours: 2,
    randomizeStart: true,
    startTimeRange: {
      min: '2024-01-01T00:00:00Z',
      max: '2024-12-31T23:59:59Z'
    }
  },
  generate: async (count: number, options?: GeneratorOptions) => {
    const finalOptions = { ...timeRangeGenerator.defaultOptions, ...options };
    
    // Calculate the time window in milliseconds
    const windowMs = finalOptions.windowHours! * 60 * 60 * 1000;
    
    // Determine the start time
    let startTime: Date;
    if (finalOptions.randomizeStart) {
      const minTime = new Date(finalOptions.startTimeRange!.min!);
      const maxTime = new Date(finalOptions.startTimeRange!.max!);
      startTime = new Date(minTime.getTime() + Math.random() * (maxTime.getTime() - minTime.getTime()));
    } else {
      startTime = new Date(finalOptions.startTimeRange!.min!);
    }
    
    // Generate evenly spaced timestamps
    return Array.from({ length: count }, (_, index) => {
      const timeOffset = (index / (count - 1)) * windowMs;
      return new Date(startTime.getTime() + timeOffset);
    });
  }
};
```

## Using the Generator with TimeScale DB

I've made it easy to use this generator in your Data Diluvium configuration like this:

```json
{
  "generator": "time-range",
  "options": {
    "windowHours": 2,
    "randomizeStart": true,
    "startTimeRange": {
      "min": "2024-01-01T00:00:00Z",
      "max": "2024-12-31T23:59:59Z"
    }
  }
}
```

This configuration works perfectly with TimeScale DB's time-series capabilities, allowing you to generate properly spaced timestamps that can be used as the time dimension for your other data generators.

## What Makes This Implementation Special?

I've designed this implementation with several key features that work well with time-series databases:

1. **Even Distribution**: Points are evenly spaced across the time window, ensuring consistent sampling rates.
2. **Flexible Window**: While defaulting to 2 hours, the window size can be adjusted if needed.
3. **Random Start**: The generator can start at a random point within a specified time range, preventing bias in the data.
4. **Type Compatibility**: The generator supports various timestamp SQL types including TIMESTAMP, TIMESTAMP WITH TIME ZONE, and DATETIME.
5. **Precision Control**: Supports different timestamp precisions through compatible types.

## Testing the Generator

I've implemented comprehensive testing to ensure our time range generator produces properly spaced timestamps:

```typescript
describe('Time Range Generator', () => {
  it('should generate correct number of timestamps', () => {
    const timestamps = generateTimeRange({ count: 12 });
    expect(timestamps).toHaveLength(12);
  });

  it('should space timestamps evenly', () => {
    const timestamps = generateTimeRange({ count: 3 });
    const intervals = timestamps.slice(1).map((t, i) => 
      t.getTime() - timestamps[i].getTime()
    );
    expect(intervals[0]).toBe(intervals[1]); // All intervals should be equal
  });

  it('should respect the time window', () => {
    const timestamps = generateTimeRange({ count: 100 });
    const windowMs = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
    expect(timestamps[timestamps.length - 1].getTime() - timestamps[0].getTime())
      .toBe(windowMs);
  });

  it('should generate timestamps within specified range', () => {
    const minTime = new Date('2024-01-01T00:00:00Z');
    const maxTime = new Date('2024-12-31T23:59:59Z');
    const timestamps = generateTimeRange({
      randomizeStart: true,
      startTimeRange: { min: minTime.toISOString(), max: maxTime.toISOString() }
    });
    
    timestamps.forEach(timestamp => {
      expect(timestamp.getTime()).toBeGreaterThanOrEqual(minTime.getTime());
      expect(timestamp.getTime()).toBeLessThanOrEqual(maxTime.getTime());
    });
  });
});
```

## Combining with Other Generators

The Time Range generator is particularly powerful when combined with the humidity and temperature generators. For example:

```json
{
  "columns": [
    {
      "name": "timestamp",
      "generator": "time-range",
      "options": {
        "windowHours": 2,
        "randomizeStart": true
      }
    },
    {
      "name": "temperature",
      "generator": "temperature",
      "options": {
        "minTemperature": 15,
        "maxTemperature": 25,
        "includeTimeVariation": true
      }
    },
    {
      "name": "humidity",
      "generator": "humidity",
      "options": {
        "minHumidity": 40,
        "maxHumidity": 60,
        "includeTimeVariation": true
      }
    }
  ]
}
```

This configuration will generate a complete dataset with:
- Evenly spaced timestamps across a 2-hour window
- Temperature values that vary realistically with time
- Humidity values that complement the temperature data

That should do it! Let's generate some data and see where we've arrived.

Happy thrashing coding! ⏰ 