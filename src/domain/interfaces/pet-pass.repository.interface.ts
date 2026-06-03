import { PetPass } from '../entities/pet-pass.entity';

/**
 * Interface de repositório para o Smart Pet Pass.
 *
 * Padrão SOLID ISP: segregada das demais interfaces de repositório.
 */
export interface IPetPassRepository {
  save(petPass: Omit<PetPass, 'id' | 'issuedAt' | 'pet' | 'isExpired'>): Promise<PetPass>;
  findById(id: string): Promise<PetPass | null>;
  findLatestByPetIdAndDestination(
    petId: string,
    destinationCode: string,
  ): Promise<PetPass | null>;
}

export const PET_PASS_REPOSITORY = Symbol('IPetPassRepository');
