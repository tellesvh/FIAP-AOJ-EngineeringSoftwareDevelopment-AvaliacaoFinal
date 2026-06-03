import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pet } from '../../domain/entities/pet.entity';
import { IPetRepository } from '../../domain/interfaces/pet.repository.interface';

/**
 * Implementação concreta de IPetRepository com TypeORM + sql.js.
 *
 * Padrão SOLID LSP: esta classe e qualquer futura implementação (ex: PostgreSQL)
 * são substituíveis sem alterar o comportamento esperado pelos use cases.
 */
@Injectable()
export class PetRepository implements IPetRepository {
  constructor(
    @InjectRepository(Pet)
    private readonly repo: Repository<Pet>,
  ) {}

  async save(
    petData: Omit<Pet, 'id' | 'createdAt' | 'healthRecords' | 'petPasses'>,
  ): Promise<Pet> {
    const pet = this.repo.create(petData);
    return this.repo.save(pet);
  }

  async findById(id: string): Promise<Pet | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByMicrochip(microchip: string): Promise<Pet | null> {
    return this.repo.findOne({ where: { microchip } });
  }
}
