export type GeneratedValue = string | number | boolean | Date;

export type GeneratorOptions = {
  // Password options
  passwordLength?: number;
  passwordMemorability?: boolean;
  
  // Number range options
  minNumber?: number;
  maxNumber?: number;
  decimalPlaces?: number;
  
  // Sequential number options
  startAt?: number;
  step?: number;
  padToLength?: number;
  
  // Date range options
  minDate?: Date;
  maxDate?: Date;
  
  // Text options
  prefix?: string;
  suffix?: string;
  casing?: 'upper' | 'lower' | 'mixed';
  
  // Product code options
  format?: string;
  
  // Boolean options
  trueWeight?: number; // Probability of generating true (0-1)
  
  // Money options
  minAmount?: number;
  maxAmount?: number;
  currency?: string;
  
  // Name options
  gender?: 'male' | 'female' | undefined;

  // Foreign key options
  referencedTable?: string;
  referencedColumn?: string;
  referencedValues?: GeneratedValue[];
};

export type GeneratorConfig = {
  name: string;
  description: string;
  category: 'id' | 'name' | 'text' | 'number' | 'date' | 'custom';
  compatibleTypes: string[];
  defaultOptions?: GeneratorOptions;
  generate: (count: number, options?: GeneratorOptions) => Promise<GeneratedValue[]>;
};

export type GeneratorRegistry = {
  [key: string]: GeneratorConfig;
}; 