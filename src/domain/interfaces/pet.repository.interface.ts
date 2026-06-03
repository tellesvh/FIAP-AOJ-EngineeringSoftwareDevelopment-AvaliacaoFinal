import { Pet } from '../entities/pet.entity';

/**
 * Interface de repositório para a entidade Pet.
 *
 * Padrão SOLID DIP (Dependency Inversion): a camada de domínio depende desta
 * abstração, não da implementação concreta (TypeORM/SQLite).
 * Padrão SOLID ISP (Interface Segregation): segregada das demais interfaces
 * de repositório; cada use case injeta apenas o que necessita.
 */
export interface IPetRepository {
  save(pet: Omit<Pet, 'id' | 'createdAt' | 'healthRecords' | 'petPasses'>): Promise<Pet>;
  findById(id: string): Promise<Pet | null>;
  findByMicrochip(microchip: string): Promise<Pet | null>;
}

export const PET_REPOSITORY = Symbol('IPetRepository');
