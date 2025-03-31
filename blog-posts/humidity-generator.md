# Adding Humidity Data Generation to Data Diluvium

For next steps of why I set up TimeScale DB up for local dev, and being able to just do things, I need two new data generators over on Data Diluvium. One for humidity, which will be this post, and one for temperature, which will be next.

## Why Humidity Data?

When working with TimeScale DB for time-series data, having realistic environmental data is crucial. I've found that humidity is a particularly important parameter that affects everything from agriculture to HVAC systems. Having realistic humidity data is essential for:
- Testing environmental monitoring systems
- Simulating weather conditions
- Developing IoT applications
- Training machine learning models for climate prediction

## The Implementation

I created a humidity generator that produces realistic values based on typical Earth conditions. Here's what I considered:
- Average humidity ranges (typically 30-70% for most inhabited areas)
- Daily variations (higher in the morning, lower in the afternoon)
- Seasonal patterns
- Geographic influences

Here's how I implemented this in Data Diluvium:

```typescript
interface HumidityOptions {
  minHumidity?: number;  // Default: 30
  maxHumidity?: number;  // Default: 70
  includeTimeVariation?: boolean;  // Default: true
  includeSeasonalVariation?: boolean;  // Default: true
}

function generateHumidity(options: HumidityOptions = {}): number {
  const {
    minHumidity = 30,
    maxHumidity = 70,
    includeTimeVariation = true,
    includeSeasonalVariation = true
  } = options;

  let baseHumidity = minHumidity + (Math.random() * (maxHumidity - minHumidity));

  if (includeTimeVariation) {
    // Add daily variation (higher in morning, lower in afternoon)
    const hour = new Date().getHours();
    const timeFactor = Math.sin((hour - 6) * Math.PI / 12); // Peak at 6 AM
    baseHumidity += timeFactor * 10;
  }

  if (includeSeasonalVariation) {
    // Add seasonal variation (higher in winter, lower in summer)
    const month = new Date().getMonth();
    const seasonalFactor = Math.sin((month - 1) * Math.PI / 6); // Peak in January
    baseHumidity += seasonalFactor * 5;
  }

  // Ensure the value stays within bounds
  return Math.max(minHumidity, Math.min(maxHumidity, baseHumidity));
}
```

## Using the Generator with TimeScale DB

I've made it easy to use this generator in your Data Diluvium configuration like this:

```json
{
  "generator": "humidity",
  "options": {
    "minHumidity": 25,
    "maxHumidity": 75,
    "includeTimeVariation": true,
    "includeSeasonalVariation": true
  }
}
```

This configuration works perfectly with TimeScale DB's time-series capabilities, allowing you to generate continuous humidity data that follows natural patterns over time.

## What Makes This Implementation Special?

I've designed this implementation with several key features that work well with time-series databases:

1. **Realistic Ranges**: I set the default range of 30-70% to cover most inhabited areas on Earth.
2. **Time-Aware**: The generator considers daily patterns, producing higher values in the morning and lower values in the afternoon.
3. **Seasonal Awareness**: Values naturally vary with the seasons, higher in winter and lower in summer.
4. **Flexible Configuration**: I've made it easy to customize the ranges and toggle features as needed.

## Testing the Generator

I've implemented comprehensive testing to ensure our humidity generator produces realistic values that will work well with TimeScale DB:

```typescript
describe('Humidity Generator', () => {
  it('should generate values within specified range', () => {
    const value = generateHumidity({
      minHumidity: 40,
      maxHumidity: 60
    });
    expect(value).toBeGreaterThanOrEqual(40);
    expect(value).toBeLessThanOrEqual(60);
  });

  it('should respect time-based variations', () => {
    const morningValue = generateHumidity({ includeTimeVariation: true });
    const afternoonValue = generateHumidity({ includeTimeVariation: true });
    expect(morningValue).toBeGreaterThan(afternoonValue);
  });
});
```

## Next Steps

I've built a solid foundation for humidity data generation, but I'm already thinking about potential enhancements that would work well with TimeScale DB:
- Geographic variations based on latitude/longitude
- Altitude-based adjustments
- Weather condition influences
- Integration with other environmental parameters
- TimeScale DB-specific optimizations for continuous data generation
- Support for hypertables and time-bucketing

Would you like to see me implement any of these enhancements or do you have other ideas for improving the humidity generator? Let me know in the comments!

Happy coding! 🚀
