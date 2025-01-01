import { GeneratorConfig, GeneratorRegistry } from './types';
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
  booleanGenerator
} from './basic';

class DataGeneratorRegistry {
  private generators: GeneratorRegistry = {};

  constructor() {
    // Register built-in generators with consistent keys (lowercase, no spaces)
    this.register('uuid', uuidGenerator);
    this.register('firstname', firstNameGenerator);
    this.register('lastname', lastNameGenerator);
    this.register('email', emailGenerator);
    this.register('timestamp', timestampGenerator);
    this.register('sequentialnumber', sequentialNumberGenerator);
    this.register('money', moneyGenerator);
    this.register('phonenumber', phoneNumberGenerator);
    this.register('company', companyGenerator);
    this.register('address', addressGenerator);
    this.register('username', usernameGenerator);
    this.register('password', passwordGenerator);
    this.register('productcode', productCodeGenerator);
    this.register('boolean', booleanGenerator);
  }

  register(key: string, generator: GeneratorConfig) {
    this.generators[key] = generator;
  }

  get(key: string): GeneratorConfig | undefined {
    return this.generators[key];
  }

  getAll(): GeneratorRegistry {
    return this.generators;
  }

  getCompatibleGenerators(sqlType: string): GeneratorConfig[] {
    const normalizedType = sqlType.toUpperCase().trim();
    console.log(`Finding generators for SQL type: ${normalizedType}`);
    
    // Extract base type without size/precision
    const baseType = normalizedType.split('(')[0].trim();
    console.log(`Base type: ${baseType}`);
    
    // Get compatible generators
    const compatibleGens = Object.values(this.generators).filter(generator => {
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
      return Object.values(this.generators);
    }

    console.log(`Found ${compatibleGens.length} compatible generators for ${normalizedType}`);
    return compatibleGens;
  }

  async generate(key: string, count: number): Promise<any[]> {
    const generator = this.get(key);
    if (!generator) {
      throw new Error(`Generator '${key}' not found`);
    }
    return generator.generate(count);
  }
}

// Export a singleton instance
export const generatorRegistry = new DataGeneratorRegistry(); 