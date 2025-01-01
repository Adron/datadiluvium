import { GeneratorConfig } from './types';
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

  getCompatibleGenerators(dataType: string): GeneratorConfig[] {
    const normalizedType = this.normalizeDataType(dataType);
    return this.generators.filter(generator => 
      generator.compatibleTypes.some(type => 
        this.normalizeDataType(type) === normalizedType
      )
    );
  }
}

export const generatorRegistry = new DataGeneratorRegistry(); 