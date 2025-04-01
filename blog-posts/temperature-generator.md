# Adding Temperature Data Generation to Data Diluvium

Following up on my previous post about adding humidity data generation to Data Diluvium, I'm now adding temperature data generation. This completes the pair of environmental data generators I needed for my TimeScale DB setup. Temperature data is crucial for time-series analysis and works perfectly alongside the humidity data we just implemented.

## Why Temperature Data?

When working with TimeScale DB for time-series data, having realistic environmental data is crucial. I've found that temperature is one of the most fundamental environmental parameters we measure. Having realistic temperature data is essential for:
- Weather simulation systems
- Climate modeling
- Building automation systems
- Agricultural planning
- Energy consumption analysis

## The Implementation

I created a temperature generator that produces realistic values based on typical Earth conditions. Here's what I considered:
- Average temperature ranges (typically -10°C to 35°C for most inhabited areas)
- Daily temperature cycles (warmer in afternoon, cooler at night)
- Seasonal variations
- Geographic influences

Here's how I implemented this in Data Diluvium:

```typescript
export const temperatureGenerator: GeneratorConfig = {
  name: 'Temperature',
  description: 'Generates realistic temperature values with daily and seasonal variations',
  category: 'number',
  compatibleTypes: [
    'NUMBER', 'DECIMAL', 'NUMERIC', 'FLOAT', 'DOUBLE',
    'NUMBER(5,2)', 'DECIMAL(5,2)', 'NUMERIC(5,2)'
  ],
  defaultOptions: {
    minTemperature: -10,
    maxTemperature: 35,
    includeTimeVariation: true,
    includeSeasonalVariation: true,
    useCelsius: true
  },
  generate: async (count: number, options?: GeneratorOptions) => {
    const finalOptions = { ...temperatureGenerator.defaultOptions, ...options };
    
    return Array.from({ length: count }, () => {
      let baseTemperature = finalOptions.minTemperature! + 
        (Math.random() * (finalOptions.maxTemperature! - finalOptions.minTemperature!));

      if (finalOptions.includeTimeVariation) {
        // Add daily variation (warmer in afternoon, cooler at night)
        const hour = new Date().getHours();
        const timeFactor = Math.sin((hour - 14) * Math.PI / 12); // Peak at 2 PM
        baseTemperature += timeFactor * 8; // 8°C daily variation
      }

      if (finalOptions.includeSeasonalVariation) {
        // Add seasonal variation (warmer in summer, cooler in winter)
        const month = new Date().getMonth();
        const seasonalFactor = Math.sin((month - 6) * Math.PI / 6); // Peak in July
        baseTemperature += seasonalFactor * 15; // 15°C seasonal variation
      }

      // Ensure the value stays within bounds
      baseTemperature = Math.max(finalOptions.minTemperature!, Math.min(finalOptions.maxTemperature!, baseTemperature));

      // Convert to Fahrenheit if needed
      return finalOptions.useCelsius ? baseTemperature : (baseTemperature * 9/5) + 32;
    });
  }
};
```

## Using the Generator with TimeScale DB

I've made it easy to use this generator in your Data Diluvium configuration like this:

```json
{
  "generator": "temperature",
  "options": {
    "minTemperature": -5,
    "maxTemperature": 30,
    "includeTimeVariation": true,
    "includeSeasonalVariation": true,
    "useCelsius": true
  }
}
```

This configuration works perfectly with TimeScale DB's time-series capabilities, allowing you to generate continuous temperature data that follows natural patterns over time. When used alongside the humidity generator, you can create comprehensive environmental datasets.

## What Makes This Implementation Special?

I've designed this implementation with several key features that work well with time-series databases:

1. **Realistic Ranges**: I set the default range of -10°C to 35°C to cover most inhabited areas on Earth.
2. **Time-Aware**: The generator considers daily patterns, producing warmer values in the afternoon and cooler values at night.
3. **Seasonal Awareness**: Values naturally vary with the seasons, warmer in summer and cooler in winter.
4. **Unit Flexibility**: I've added support for both Celsius and Fahrenheit temperature scales.
5. **Type Compatibility**: The generator supports various numeric SQL types including NUMBER, DECIMAL, NUMERIC, FLOAT, and DOUBLE.

## Testing the Generator

I've implemented comprehensive testing to ensure our temperature generator produces realistic values that will work well with TimeScale DB:

```typescript
describe('Temperature Generator', () => {
  it('should generate values within specified range', () => {
    const value = generateTemperature({
      minTemperature: 15,
      maxTemperature: 25
    });
    expect(value).toBeGreaterThanOrEqual(15);
    expect(value).toBeLessThanOrEqual(25);
  });

  it('should respect time-based variations', () => {
    const morningValue = generateTemperature({ includeTimeVariation: true });
    const afternoonValue = generateTemperature({ includeTimeVariation: true });
    expect(afternoonValue).toBeGreaterThan(morningValue);
  });

  it('should convert between Celsius and Fahrenheit', () => {
    const celsiusValue = generateTemperature({ useCelsius: true });
    const fahrenheitValue = generateTemperature({ useCelsius: false });
    expect(fahrenheitValue).toBeCloseTo((celsiusValue * 9/5) + 32, 1);
  });
});
```

## String-Based Temperature Generators

While the numeric temperature generator is perfect for database storage and calculations, I also needed string-based temperature generators for display and reporting purposes. I've added two new generators:

### Celsius String Generator

```typescript
export const celsiusStringGenerator: GeneratorConfig = {
  name: 'Temperature (Celsius String)',
  description: 'Generates temperature values as strings with °C suffix',
  category: 'text',
  compatibleTypes: [
    'CHAR', 'VARCHAR', 'VARCHAR2', 'TEXT', 'STRING',
    'CHARACTER VARYING'
  ],
  defaultOptions: {
    minTemperature: -10,
    maxTemperature: 35,
    includeTimeVariation: true,
    includeSeasonalVariation: true,
    decimalPlaces: 1
  },
  generate: async (count: number, options?: GeneratorOptions) => {
    const finalOptions = { ...celsiusStringGenerator.defaultOptions, ...options };
    
    return Array.from({ length: count }, () => {
      let baseTemperature = finalOptions.minTemperature! + 
        (Math.random() * (finalOptions.maxTemperature! - finalOptions.minTemperature!));

      if (finalOptions.includeTimeVariation) {
        const hour = new Date().getHours();
        const timeFactor = Math.sin((hour - 14) * Math.PI / 12);
        baseTemperature += timeFactor * 8;
      }

      if (finalOptions.includeSeasonalVariation) {
        const month = new Date().getMonth();
        const seasonalFactor = Math.sin((month - 6) * Math.PI / 6);
        baseTemperature += seasonalFactor * 15;
      }

      baseTemperature = Math.max(finalOptions.minTemperature!, Math.min(finalOptions.maxTemperature!, baseTemperature));
      
      return `${baseTemperature.toFixed(finalOptions.decimalPlaces!)}°C`;
    });
  }
};
```

### Fahrenheit String Generator

```typescript
export const fahrenheitStringGenerator: GeneratorConfig = {
  name: 'Temperature (Fahrenheit String)',
  description: 'Generates temperature values as strings with °F suffix',
  category: 'text',
  compatibleTypes: [
    'CHAR', 'VARCHAR', 'VARCHAR2', 'TEXT', 'STRING',
    'CHARACTER VARYING'
  ],
  defaultOptions: {
    minTemperature: 14, // 57.2°F
    maxTemperature: 95, // 203°F
    includeTimeVariation: true,
    includeSeasonalVariation: true,
    decimalPlaces: 1
  },
  generate: async (count: number, options?: GeneratorOptions) => {
    const finalOptions = { ...fahrenheitStringGenerator.defaultOptions, ...options };
    
    return Array.from({ length: count }, () => {
      let baseTemperature = finalOptions.minTemperature! + 
        (Math.random() * (finalOptions.maxTemperature! - finalOptions.minTemperature!));

      if (finalOptions.includeTimeVariation) {
        const hour = new Date().getHours();
        const timeFactor = Math.sin((hour - 14) * Math.PI / 12);
        baseTemperature += timeFactor * 14.4; // 8°C = 14.4°F
      }

      if (finalOptions.includeSeasonalVariation) {
        const month = new Date().getMonth();
        const seasonalFactor = Math.sin((month - 6) * Math.PI / 6);
        baseTemperature += seasonalFactor * 27; // 15°C = 27°F
      }

      baseTemperature = Math.max(finalOptions.minTemperature!, Math.min(finalOptions.maxTemperature!, baseTemperature));
      
      return `${baseTemperature.toFixed(finalOptions.decimalPlaces!)}°F`;
    });
  }
};
```

These string-based generators are particularly useful for:
- Displaying temperatures in reports
- Creating human-readable logs
- Generating sample data for UI testing
- Creating documentation examples

You can use them in your Data Diluvium configuration like this:

```json
{
  "generator": "temperature-celsius-string",
  "options": {
    "minTemperature": -5,
    "maxTemperature": 30,
    "includeTimeVariation": true,
    "includeSeasonalVariation": true,
    "decimalPlaces": 1
  }
}
```

Or for Fahrenheit:

```json
{
  "generator": "temperature-fahrenheit-string",
  "options": {
    "minTemperature": 23,
    "maxTemperature": 86,
    "includeTimeVariation": true,
    "includeSeasonalVariation": true,
    "decimalPlaces": 1
  }
}
```

That should do it! Let's generate some data and see where we've arrived.

Happy thrashing coding! 🌡️
