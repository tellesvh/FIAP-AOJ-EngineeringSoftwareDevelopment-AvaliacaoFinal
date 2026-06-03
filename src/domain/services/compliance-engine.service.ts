import { Injectable, Inject } from '@nestjs/common';
import { differenceInDays } from '../utils/date.utils';
import { ComplianceStatus } from '../value-objects/compliance-status.vo';
import { DestinationRule } from '../entities/destination-rule.entity';
import { HealthRecord } from '../entities/health-record.entity';
import { RecordType } from '../enums/record-type.enum';
import {
  IDestinationRuleRepository,
  DESTINATION_RULE_REPOSITORY,
} from '../interfaces/destination-rule.repository.interface';

/**
 * Motor CaaS (Compliance as a Service) — núcleo do domínio iPet.
 *
 * Avalia o StatusCompliance (Apto/Inapto) de um Pet para um Destino,
 * aplicando o período de carência sanitária por país:
 *   I1 — Brasil (BR):          vacina antirrábica ≥ 21 dias
 *   I2 — União Europeia (EU):  vacina + sorologia ≥ 90 dias
 *   I3 — Japão (JP):           vacina + sorologia ≥ 180 dias
 *
 * Padrões aplicados:
 *
 *   SOLID SRP — responsabilidade única: esta classe apenas avalia compliance;
 *     persistência e orquestração ficam em outras camadas.
 *
 *   SOLID OCP — aberto para extensão, fechado para modificação: novos destinos
 *     são cadastrados na tabela DestinationRule sem alterar este serviço.
 *
 *   SOLID DIP — inversão de dependência: depende de IDestinationRuleRepository
 *     (abstração), não da implementação concreta TypeORM.
 *
 *   GRASP High Cohesion — toda a lógica de avaliação sanitária está concentrada
 *     neste único serviço, sem dispersão em controllers ou use cases.
 */
@Injectable()
export class ComplianceEngineService {
  constructor(
    @Inject(DESTINATION_RULE_REPOSITORY)
    private readonly destinationRuleRepository: IDestinationRuleRepository,
  ) { }

  /**
   * Avalia o StatusCompliance consultando a RegraDestino no repositório.
   * Caso o destino não esteja cadastrado, aplica a regra padrão (21 dias de vacina).
   */
  async evaluate(
    records: HealthRecord[],
    destinationCode: string,
    referenceDate: Date = new Date(),
  ): Promise<ComplianceStatus> {
    const rule = await this.destinationRuleRepository.findByCode(destinationCode);

    const effectiveRule: DestinationRule = rule ?? {
      destinationCode,
      waitingPeriodDays: 21,
      serologyRequired: false,
      serologyWaitingPeriodDays: 0,
    };

    return this.applyRules(records, effectiveRule, referenceDate);
  }

  /**
   * Aplica as regras sanitárias sobre os registros fornecidos.
   * Método separado de evaluate() para permitir testes unitários diretos,
   * sem necessidade de mock do repositório.
   */
  applyRules(
    records: HealthRecord[],
    rule: DestinationRule,
    referenceDate: Date = new Date(),
  ): ComplianceStatus {
    const lastVaccine = this.getLatestRecord(records, RecordType.VACCINE);

    if (!lastVaccine) {
      return ComplianceStatus.ineligible(
        'Nenhuma vacina antirrábica registrada.',
      );
    }

    const vaccineDaysAgo = differenceInDays(
      referenceDate,
      new Date(lastVaccine.appliedAt),
    );

    if (vaccineDaysAgo < rule.waitingPeriodDays) {
      const releaseDate = new Date(lastVaccine.appliedAt);
      releaseDate.setDate(releaseDate.getDate() + rule.waitingPeriodDays);
      return ComplianceStatus.ineligible(
        `Período de carência da vacina não cumprido para ${rule.destinationCode}. ` +
        `Faltam ${rule.waitingPeriodDays - vaccineDaysAgo} dia(s).`,
        releaseDate,
      );
    }

    if (rule.serologyRequired) {
      const lastSerology = this.getLatestRecord(records, RecordType.SEROLOGY);

      if (!lastSerology) {
        return ComplianceStatus.ineligible(
          `Sorologia obrigatória para o destino ${rule.destinationCode} não registrada.`,
        );
      }

      const serologyDaysAgo = differenceInDays(
        referenceDate,
        new Date(lastSerology.appliedAt),
      );

      if (serologyDaysAgo < rule.serologyWaitingPeriodDays) {
        const releaseDate = new Date(lastSerology.appliedAt);
        releaseDate.setDate(
          releaseDate.getDate() + rule.serologyWaitingPeriodDays,
        );
        return ComplianceStatus.ineligible(
          `Período de carência da sorologia não cumprido para ${rule.destinationCode}. ` +
          `Faltam ${rule.serologyWaitingPeriodDays - serologyDaysAgo} dia(s).`,
          releaseDate,
        );
      }
    }

    return ComplianceStatus.eligible();
  }

  /** Retorna o registro mais recente de um tipo específico. */
  private getLatestRecord(
    records: HealthRecord[],
    type: RecordType,
  ): HealthRecord | null {
    const filtered = records
      .filter((r) => r.recordType === type)
      .sort(
        (a, b) =>
          new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime(),
      );
    return filtered[0] ?? null;
  }
}
