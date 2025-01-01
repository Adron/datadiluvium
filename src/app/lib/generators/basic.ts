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