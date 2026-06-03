import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DestinationRule } from '../../domain/entities/destination-rule.entity';
import { IDestinationRuleRepository } from '../../domain/interfaces/destination-rule.repository.interface';

/**
 * Implementação concreta de IDestinationRuleRepository com TypeORM + sql.js.
 * Fornece as RegraDestino (waiting period por país) para o ComplianceEngineService.
 */
@Injectable()
export class DestinationRuleRepository implements IDestinationRuleRepository {
  constructor(
    @InjectRepository(DestinationRule)
    private readonly repo: Repository<DestinationRule>,
  ) {}

  async findByCode(destinationCode: string): Promise<DestinationRule | null> {
    return this.repo.findOne({ where: { destinationCode } });
  }

  async findAll(): Promise<DestinationRule[]> {
    return this.repo.find();
  }
}
