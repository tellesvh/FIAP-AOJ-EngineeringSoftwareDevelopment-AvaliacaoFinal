import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PetPass } from '../../domain/entities/pet-pass.entity';
import { IPetPassRepository } from '../../domain/interfaces/pet-pass.repository.interface';

/**
 * Implementação concreta de IPetPassRepository com TypeORM + sql.js.
 * Persiste o Smart Pet Pass após a avaliação do motor CaaS.
 */
@Injectable()
export class PetPassRepository implements IPetPassRepository {
  constructor(
    @InjectRepository(PetPass)
    private readonly repo: Repository<PetPass>,
  ) {}

  async save(
    petPassData: Omit<PetPass, 'id' | 'issuedAt' | 'pet' | 'isExpired'>,
  ): Promise<PetPass> {
    const petPass = this.repo.create(petPassData as Partial<PetPass>);
    return this.repo.save(petPass);
  }

  async findById(id: string): Promise<PetPass | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findLatestByPetIdAndDestination(
    petId: string,
    destinationCode: string,
  ): Promise<PetPass | null> {
    return this.repo.findOne({
      where: { petId, destinationCode },
      order: { issuedAt: 'DESC' },
    });
  }
}
