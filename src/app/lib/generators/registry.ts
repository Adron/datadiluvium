import { GeneratorConfig, GeneratedValue } from './types';
import { 
  uuidGenerator, 
  firstNameGenerator, 
  lastNameGenerator,
  emailGenerator,
  timestampGenerator,
  sequentialNumberGenerator,
  moneyGenerator,
  phoneNumberGenerator,
  companyGenerator,
  addressGenerator,
  usernameGenerator,
  passwordGenerator,
  productCodeGenerator,
  booleanGenerator,
  foreignKeyGenerator,
  humidityGenerator,
  temperatureGenerator,
  celsiusStringGenerator,
  fahrenheitStringGenerator,
  timeRangeGenerator
} from './basic';

export class DataGeneratorRegistry {
  private generators: GeneratorConfig[] = [];

  constructor() {
    // Register built-in generators
    this.register(uuidGenerator);
    this.register(firstNameGenerator);
    this.register(lastNameGenerator);
    this.register(emailGenerator);
    this.register(timestampGenerator);
    this.register(sequentialNumberGenerator);
    this.register(moneyGenerator);
    this.register(phoneNumberGenerator);
    this.register(companyGenerator);
    this.register(addressGenerator);
    this.register(usernameGenerator);
    this.register(passwordGenerator);
    this.register(productCodeGenerator);
    this.register(booleanGenerator);
    this.register(foreignKeyGenerator);
    this.register(humidityGenerator);
    this.register(temperatureGenerator);
    this.register(celsiusStringGenerator);
    this.register(fahrenheitStringGenerator);
    this.register(timeRangeGenerator);
  }

  register(generator: GeneratorConfig): void {
    this.generators.push(generator);
  }

  get(name: string): GeneratorConfig | undefined {
    return this.generators.find(g => g.name.toLowerCase() === name.toLowerCase());
  }

  private normalizeDataType(dataType: string): string {
    return dataType.toUpperCase().trim().split('(')[0];
  }

  getCompatibleGenerators(sqlType: string): GeneratorConfig[] {
    const normalizedType = sqlType.toUpperCase().trim();
    console.log(`Finding generators for SQL type: ${normalizedType}`);
    
    // Extract base type without size/precision
    const baseType = normalizedType.split('(')[0].trim();
    console.log(`Base type: ${baseType}`);
    
    // Get compatible generators
    const compatibleGens = this.generators.filter(generator => {
      const isCompatible = generator.compatibleTypes.some(type => {
        const compatType = type.toUpperCase().trim();
        
        // Handle exact matches
        if (compatType === normalizedType) {
          console.log(`Exact match found for ${generator.name} with type ${compatType}`);
          return true;
        }
        
        // Handle base type matches
        if (compatType === baseType) {
          console.log(`Base type match found for ${generator.name} with type ${compatType}`);
          return true;
        }
        
        // Handle parameterized types
        const compatBaseType = compatType.split('(')[0].trim();
        if (compatBaseType === baseType) {
          console.log(`Parameterized type match found for ${generator.name} with type ${compatType}`);
          return true;
        }
        
        return false;
      });

      if (isCompatible) {
        console.log(`Generator '${generator.name}' is compatible with ${normalizedType}`);
      }
      return isCompatible;
    });

    // If no compatible generators found, return all generators
    if (compatibleGens.length === 0) {
      console.log(`No specific compatible generators found for ${normalizedType}, returning all generators`);
      return this.generators;
    }

    console.log(`Found ${compatibleGens.length} compatible generators for ${normalizedType}`);
    return compatibleGens;
  }

  async generate(key: string, count: number): Promise<GeneratedValue[]> {
    const generator = this.get(key);
    if (!generator) {
      throw new Error(`Generator '${key}' not found`);
    }
    return generator.generate(count);
  }
}

export const generatorRegistry = new DataGeneratorRegistry(); 