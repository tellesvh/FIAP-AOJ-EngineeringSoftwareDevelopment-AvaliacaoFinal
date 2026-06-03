import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DestinationRule } from '../../domain/entities/destination-rule.entity';

/**
 * Popula as RegraDestino na inicialização da aplicação.
 * Garante que as regras de waiting period (período de carência) para BR, EU e JP
 * estejam sempre disponíveis para o motor CaaS, sem depender de migrações manuais.
 */
@Injectable()
export class DatabaseSeeder implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(DestinationRule)
    private readonly destinationRuleRepo: Repository<DestinationRule>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seedDestinationRules();
  }

  private async seedDestinationRules(): Promise<void> {
    const rules: DestinationRule[] = [
      {
        destinationCode: 'BR',
        waitingPeriodDays: 21,
        serologyRequired: false,
        serologyWaitingPeriodDays: 0,
      },
      {
        destinationCode: 'EU',
        waitingPeriodDays: 90,
        serologyRequired: true,
        serologyWaitingPeriodDays: 90,
      },
      {
        destinationCode: 'JP',
        waitingPeriodDays: 180,
        serologyRequired: true,
        serologyWaitingPeriodDays: 180,
      },
    ];

    for (const rule of rules) {
      const exists = await this.destinationRuleRepo.findOne({
        where: { destinationCode: rule.destinationCode },
      });
      if (!exists) {
        await this.destinationRuleRepo.save(rule);
      }
    }
  }
}
