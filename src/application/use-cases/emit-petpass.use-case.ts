import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PetPass } from '../../domain/entities/pet-pass.entity';
import { ComplianceEngineService } from '../../domain/services/compliance-engine.service';
import {
  IPetRepository,
  PET_REPOSITORY,
} from '../../domain/interfaces/pet.repository.interface';
import {
  IHealthRecordRepository,
  HEALTH_RECORD_REPOSITORY,
} from '../../domain/interfaces/health-record.repository.interface';
import {
  IPetPassRepository,
  PET_PASS_REPOSITORY,
} from '../../domain/interfaces/pet-pass.repository.interface';

/**
 * Caso de uso: Emissão do Smart Pet Pass.
 *
 * Orquestra a avaliação do StatusCompliance e persiste o PetPass resultante.
 *
 * Padrão GRASP Creator: este use case cria o PetPass porque é ele que agrega
 *   as informações necessárias (Pet + RegistrosSanitarios + resultado do CaaS).
 *
 * Padrão SOLID SRP: responsável exclusivamente por orquestrar a emissão;
 *   a lógica de avaliação está isolada no ComplianceEngineService.
 *
 * Padrão SOLID DIP: depende das interfaces IPetRepository, IHealthRecordRepository
 *   e IPetPassRepository — nunca das implementações TypeORM diretamente.
 */
@Injectable()
export class EmitPetPassUseCase {
  constructor(
    @Inject(PET_REPOSITORY)
    private readonly petRepository: IPetRepository,
    @Inject(HEALTH_RECORD_REPOSITORY)
    private readonly healthRecordRepository: IHealthRecordRepository,
    @Inject(PET_PASS_REPOSITORY)
    private readonly petPassRepository: IPetPassRepository,
    private readonly complianceEngine: ComplianceEngineService,
  ) {}

  async execute(petId: string, destinationCode: string): Promise<PetPass> {
    const pet = await this.petRepository.findById(petId);
    if (!pet) {
      throw new NotFoundException(`Pet ${petId} não encontrado.`);
    }

    const records = await this.healthRecordRepository.findByPetId(petId);

    const compliance = await this.complianceEngine.evaluate(
      records,
      destinationCode.toUpperCase(),
    );

    // O PetPass expira em 90 dias a partir da emissão
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

    return this.petPassRepository.save({
      petId,
      destinationCode: destinationCode.toUpperCase(),
      complianceStatus: compliance.status,
      reason: compliance.reason,
      releaseDate: compliance.releaseDate
        ? compliance.releaseDate.toISOString().split('T')[0]
        : null,
      expiresAt: expiresAt.toISOString().split('T')[0],
    });
  }
}
