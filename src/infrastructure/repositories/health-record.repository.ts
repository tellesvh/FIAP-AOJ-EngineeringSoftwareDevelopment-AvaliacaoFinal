import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HealthRecord } from '../../domain/entities/health-record.entity';
import { IHealthRecordRepository } from '../../domain/interfaces/health-record.repository.interface';

/**
 * Implementação concreta de IHealthRecordRepository com TypeORM + sql.js.
 * Persiste os RegistrosSanitarios (vacinação antirrábica, sorologia, etc.)
 * que alimentam o motor CaaS para avaliação do StatusCompliance.
 */
@Injectable()
export class HealthRecordRepository implements IHealthRecordRepository {
  constructor(
    @InjectRepository(HealthRecord)
    private readonly repo: Repository<HealthRecord>,
  ) {}

  async save(
    recordData: Omit<HealthRecord, 'id' | 'createdAt' | 'pet'>,
  ): Promise<HealthRecord> {
    const record = this.repo.create(recordData);
    return this.repo.save(record);
  }

  async findByPetId(petId: string): Promise<HealthRecord[]> {
    return this.repo.find({ where: { petId } });
  }
}
