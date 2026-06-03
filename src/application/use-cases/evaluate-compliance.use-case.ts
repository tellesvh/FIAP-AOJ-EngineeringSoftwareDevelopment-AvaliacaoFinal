import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ComplianceStatus } from '../../domain/value-objects/compliance-status.vo';
import { ComplianceEngineService } from '../../domain/services/compliance-engine.service';
import {
  IPetPassRepository,
  PET_PASS_REPOSITORY,
} from '../../domain/interfaces/pet-pass.repository.interface';
import {
  IHealthRecordRepository,
  HEALTH_RECORD_REPOSITORY,
} from '../../domain/interfaces/health-record.repository.interface';

/**
 * Caso de uso: Reavaliação do StatusCompliance de um PetPass existente.
 *
 * Permite verificar se o animal já atingiu o waiting period (período de carência)
 * necessário sem emitir um novo PetPass — útil para acompanhamento pelo Responsável.
 *
 * Padrão SOLID SRP: responsabilidade exclusiva de reavaliar compliance;
 *   não persiste nenhum dado novo.
 */
@Injectable()
export class EvaluateComplianceUseCase {
  constructor(
    @Inject(PET_PASS_REPOSITORY)
    private readonly petPassRepository: IPetPassRepository,
    @Inject(HEALTH_RECORD_REPOSITORY)
    private readonly healthRecordRepository: IHealthRecordRepository,
    private readonly complianceEngine: ComplianceEngineService,
  ) {}

  async execute(petPassId: string): Promise<ComplianceStatus> {
    const petPass = await this.petPassRepository.findById(petPassId);
    if (!petPass) {
      throw new NotFoundException(`PetPass ${petPassId} não encontrado.`);
    }

    const records = await this.healthRecordRepository.findByPetId(petPass.petId);

    return this.complianceEngine.evaluate(records, petPass.destinationCode);
  }
}
