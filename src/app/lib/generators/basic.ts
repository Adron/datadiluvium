import { faker } from '@faker-js/faker';
import { GeneratorConfig, GeneratorOptions } from './types';

export const uuidGenerator: GeneratorConfig = {
  name: 'UUID',
  description: 'Generates RFC4122 version 4 UUIDs',
  category: 'id',
  compatibleTypes: [
    'CHAR', 'VARCHAR', 'VARCHAR2', 'TEXT', 'STRING',
    'UUID', 'UNIQUEIDENTIFIER', 'CHARACTER VARYING'
  ],
  generate: async (count: number) => {
    return Array.from({ length: count }, () => faker.string.uuid());
  }
};

export const firstNameGenerator: GeneratorConfig = {
  name: 'First Name',
  description: 'Generates realistic first names with optional gender filter',
  category: 'name',
  compatibleTypes: [
    'CHAR', 'VARCHAR', 'VARCHAR2', 'TEXT', 'STRING',
    'NCHAR', 'NVARCHAR', 'NVARCHAR2', 'NTEXT',
    'CHARACTER VARYING'
  ],
  defaultOptions: {
    gender: undefined, // 'male' | 'female' | undefined
    casing: 'mixed' as const
  },
  generate: async (count: number, options?: GeneratorOptions) => {
    const finalOptions = { ...firstNameGenerator.defaultOptions, ...options };
    return Array.from({ length: count }, () => {
      const name = finalOptions.gender ? 
        faker.person.firstName(finalOptions.gender as 'male' | 'female') :
        faker.person.firstName();
      
      if (finalOptions.casing === 'upper') return name.toUpperCase();
      if (finalOptions.casing === 'lower') return name.toLowerCase();
      return name;
    });
  }
};

export const lastNameGenerator: GeneratorConfig = {
  name: 'Last Name',
  description: 'Generates realistic last names',
  category: 'name',
  compatibleTypes: [
    'CHAR', 'VARCHAR', 'VARCHAR2', 'TEXT', 'STRING',
    'NCHAR', 'NVARCHAR', 'NVARCHAR2', 'NTEXT',
    'CHARACTER VARYING'
  ],
  generate: async (count: number) => {
    return Array.from({ length: count }, () => faker.person.lastName());
  }
};

export const emailGenerator: GeneratorConfig = {
  name: 'Email',
  description: 'Generates realistic email addresses',
  category: 'text',
  compatibleTypes: [
    'VARCHAR', 'VARCHAR2', 'TEXT', 'NVARCHAR', 'NVARCHAR2',
    'CHARACTER VARYING', 'STRING'
  ],
  generate: async (count: number) => {
    return Array.from({ length: count }, () => faker.internet.email());
  }
};

export const timestampGenerator: GeneratorConfig = {
  name: 'Timestamp',
  description: 'Generates timestamps within a configurable date range',
  category: 'date',
  compatibleTypes: [
    'TIMESTAMP', 'DATETIME', 'DATETIME2', 
    'TIMESTAMP WITH TIME ZONE', 'TIMESTAMP WITH LOCAL TIME ZONE'
  ],
  defaultOptions: {
    minDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
    maxDate: new Date() // now
  },
  generate: async (count: number, options?: GeneratorOptions) => {
    const finalOptions = { ...timestampGenerator.defaultOptions, ...options };
    return Array.from({ length: count }, () => 
      faker.date.between({
        from: finalOptions.minDate!,
        to: finalOptions.maxDate!
      }).toISOString()
    );
  }
};

export const sequentialNumberGenerator: GeneratorConfig = {
  name: 'Sequential Number',
  description: 'Generates sequential numbers with configurable start and step',
  category: 'number',
  compatibleTypes: [
    'NUMBER', 'INT', 'INTEGER', 'BIGINT', 'DECIMAL', 'NUMERIC',
    'NUMBER(10)', 'NUMBER(19,4)', 'DECIMAL(10,2)'
  ],
  defaultOptions: {
    startAt: 1,
    step: 1,
    padToLength: 0, // 0 means no padding
    prefix: '',
    suffix: ''
  },
  generate: async (count: number, options?: GeneratorOptions) => {
    const finalOptions = { ...sequentialNumberGenerator.defaultOptions, ...options };
    return Array.from({ length: count }, (_, i) => {
      const num = finalOptions.startAt! + (i * finalOptions.step!);
      let numStr = String(num);
      if (finalOptions.padToLength! > 0) {
        numStr = numStr.padStart(finalOptions.padToLength!, '0');
      }
      return `${finalOptions.prefix || ''}${numStr}${finalOptions.suffix || ''}`;
    });
  }
};

export const moneyGenerator: GeneratorConfig = {
  name: 'Money Amount',
  description: 'Generates realistic money amounts with configurable range',
  category: 'number',
  compatibleTypes: [
    'NUMBER', 'DECIMAL', 'NUMERIC', 'MONEY',
    'NUMBER(19,4)', 'DECIMAL(10,2)', 'NUMERIC(19,4)'
  ],
  defaultOptions: {
    minAmount: 10,
    maxAmount: 1000,
    decimalPlaces: 2,
    currency: 'USD'
  },
  generate: async (count: number, options?: GeneratorOptions) => {
    const finalOptions = { ...moneyGenerator.defaultOptions, ...options };
    return Array.from({ length: count }, () => 
      Number(faker.commerce.price({
        min: finalOptions.minAmount,
        max: finalOptions.maxAmount,
        dec: finalOptions.decimalPlaces
      }))
    );
  }
};

export const phoneNumberGenerator: GeneratorConfig = {
  name: 'Phone Number',
  description: 'Generates formatted phone numbers',
  category: 'text',
  compatibleTypes: [
    'VARCHAR', 'VARCHAR2', 'CHAR', 'TEXT',
    'CHARACTER VARYING', 'STRING'
  ],
  generate: async (count: number) => {
    return Array.from({ length: count }, () => faker.phone.number());
  }
};

export const companyGenerator: GeneratorConfig = {
  name: 'Company Name',
  description: 'Generates realistic company names',
  category: 'text',
  compatibleTypes: [
    'VARCHAR', 'VARCHAR2', 'TEXT', 'NVARCHAR', 'NVARCHAR2',
    'CHARACTER VARYING', 'STRING'
  ],
  generate: async (count: number) => {
    return Array.from({ length: count }, () => faker.company.name());
  }
};

export const addressGenerator: GeneratorConfig = {
  name: 'Street Address',
  description: 'Generates realistic street addresses',
  category: 'text',
  compatibleTypes: [
    'VARCHAR', 'VARCHAR2', 'TEXT', 'NVARCHAR', 'NVARCHAR2',
    'CHARACTER VARYING', 'STRING'
  ],
  generate: async (count: number) => {
    return Array.from({ length: count }, () => faker.location.streetAddress());
  }
};

export const usernameGenerator: GeneratorConfig = {
  name: 'Username',
  description: 'Generates usernames based on name patterns',
  category: 'text',
  compatibleTypes: [
    'VARCHAR', 'VARCHAR2', 'TEXT', 'NVARCHAR', 'NVARCHAR2',
    'CHARACTER VARYING', 'STRING'
  ],
  generate: async (count: number) => {
    return Array.from({ length: count }, () => faker.internet.userName());
  }
};

export const passwordGenerator: GeneratorConfig = {
  name: 'Password',
  description: 'Generates secure passwords with configurable length and memorability',
  category: 'text',
  compatibleTypes: [
    'VARCHAR', 'VARCHAR2', 'TEXT', 'NVARCHAR', 'NVARCHAR2',
    'CHARACTER VARYING', 'STRING'
  ],
  defaultOptions: {
    passwordLength: 12,
    passwordMemorability: true
  },
  generate: async (count: number, options?: GeneratorOptions) => {
    const finalOptions = { ...passwordGenerator.defaultOptions, ...options };
    return Array.from({ length: count }, () => 
      faker.internet.password({
        length: finalOptions.passwordLength,
        memorable: finalOptions.passwordMemorability
      })
    );
  }
};

export const productCodeGenerator: GeneratorConfig = {
  name: 'Product Code',
  description: 'Generates product codes with configurable format',
  category: 'text',
  compatibleTypes: [
    'VARCHAR', 'VARCHAR2', 'TEXT', 'NVARCHAR', 'NVARCHAR2',
    'CHARACTER VARYING', 'STRING'
  ],
  defaultOptions: {
    format: 'AAA-99999', // A=alpha, 9=numeric
    prefix: '',
    suffix: '',
    casing: 'upper' as const
  },
  generate: async (count: number, options?: GeneratorOptions) => {
    const finalOptions = { ...productCodeGenerator.defaultOptions, ...options };
    const format = finalOptions.format || 'AAA-99999';
    return Array.from({ length: count }, () => {
      const code = format.replace(/A/g, () => 
        faker.string.alpha({ length: 1, casing: finalOptions.casing })
      ).replace(/9/g, () => 
        faker.string.numeric(1)
      );
      return `${finalOptions.prefix || ''}${code}${finalOptions.suffix || ''}`;
    });
  }
};

export const booleanGenerator: GeneratorConfig = {
  name: 'Boolean',
  description: 'Generates true/false values with configurable distribution',
  category: 'text',
  compatibleTypes: [
    'BOOLEAN', 'BOOL', 'BIT', 'NUMBER(1)', 'TINYINT',
    'CHAR(1)', 'VARCHAR2(1)', 'VARCHAR(1)', 'CHAR(1 BYTE)',
    'NUMBER(1,0)'
  ],
  defaultOptions: {
    trueWeight: 0.5 // 50% chance of true by default
  },
  generate: async (count: number, options?: GeneratorOptions) => {
    const finalOptions = { ...booleanGenerator.defaultOptions, ...options };
    return Array.from({ length: count }, () => 
      Math.random() < (finalOptions.trueWeight || 0.5)
    );
  }
};

export const foreignKeyGenerator: GeneratorConfig = {
  name: 'Foreign Key',
  description: 'References values from another column',
  category: 'id',
  compatibleTypes: [
    'NUMBER', 'INT', 'INTEGER', 'BIGINT', 'UUID', 'VARCHAR',
    'VARCHAR2', 'CHAR', 'TEXT', 'STRING'
  ],
  defaultOptions: {
    referencedTable: '',
    referencedColumn: '',
    referencedValues: []
  },
  generate: async (count: number, options?: GeneratorOptions) => {
    const finalOptions = { ...foreignKeyGenerator.defaultOptions, ...options };
    
    if (!finalOptions.referencedValues || finalOptions.referencedValues.length === 0) {
      throw new Error(`No referenced values available for foreign key from ${finalOptions.referencedTable}.${finalOptions.referencedColumn}`);
    }

    // Generate random values from the referenced values
    return Array.from({ length: count }, () => {
      const randomIndex = Math.floor(Math.random() * finalOptions.referencedValues!.length);
      return finalOptions.referencedValues![randomIndex];
    });
  }
};

export const humidityGenerator: GeneratorConfig = {
  name: 'Humidity',
  description: 'Generates realistic humidity values with daily and seasonal variations',
  category: 'number',
  compatibleTypes: [
    'NUMBER', 'DECIMAL', 'NUMERIC', 'FLOAT', 'DOUBLE',
    'NUMBER(5,2)', 'DECIMAL(5,2)', 'NUMERIC(5,2)'
  ],
  defaultOptions: {
    minHumidity: 30,
    maxHumidity: 70,
    includeTimeVariation: true,
    includeSeasonalVariation: true
  },
  generate: async (count: number, options?: GeneratorOptions) => {
    const finalOptions = { ...humidityGenerator.defaultOptions, ...options };
    
    return Array.from({ length: count }, () => {
      let baseHumidity = finalOptions.minHumidity! + 
        (Math.random() * (finalOptions.maxHumidity! - finalOptions.minHumidity!));

      if (finalOptions.includeTimeVariation) {
        // Add daily variation (higher in morning, lower in afternoon)
        const hour = new Date().getHours();
        const timeFactor = Math.sin((hour - 6) * Math.PI / 12); // Peak at 6 AM
        baseHumidity += timeFactor * 10;
      }

      if (finalOptions.includeSeasonalVariation) {
        // Add seasonal variation (higher in winter, lower in summer)
        const month = new Date().getMonth();
        const seasonalFactor = Math.sin((month - 1) * Math.PI / 6); // Peak in January
        baseHumidity += seasonalFactor * 5;
      }

      // Ensure the value stays within bounds
      return Math.max(finalOptions.minHumidity!, Math.min(finalOptions.maxHumidity!, baseHumidity));
    });
  }
};

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