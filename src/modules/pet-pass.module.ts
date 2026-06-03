import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PetPass } from '../domain/entities/pet-pass.entity';
import { DestinationRule } from '../domain/entities/destination-rule.entity';
import { PetPassRepository } from '../infrastructure/repositories/pet-pass.repository';
import { DestinationRuleRepository } from '../infrastructure/repositories/destination-rule.repository';
import { DatabaseSeeder } from '../infrastructure/database/database-seeder.service';
import { PET_PASS_REPOSITORY } from '../domain/interfaces/pet-pass.repository.interface';
import { DESTINATION_RULE_REPOSITORY } from '../domain/interfaces/destination-rule.repository.interface';
import { ComplianceEngineService } from '../domain/services/compliance-engine.service';
import { EmitPetPassUseCase } from '../application/use-cases/emit-petpass.use-case';
import { EvaluateComplianceUseCase } from '../application/use-cases/evaluate-compliance.use-case';
import { PetPassController } from '../presentation/controllers/pet-pass.controller';
import { PetsModule } from './pets.module';

/**
 * Módulo do bounded context PET Pass (motor CaaS).
 * Importa PetsModule para acessar IPetRepository e IHealthRecordRepository
 * sem duplicar os providers — demonstração de SOLID DIP entre módulos.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([PetPass, DestinationRule]),
    PetsModule,
  ],
  controllers: [PetPassController],
  providers: [
    { provide: PET_PASS_REPOSITORY, useClass: PetPassRepository },
    { provide: DESTINATION_RULE_REPOSITORY, useClass: DestinationRuleRepository },
    ComplianceEngineService,
    EmitPetPassUseCase,
    EvaluateComplianceUseCase,
    DatabaseSeeder,
  ],
})
export class PetPassModule {}
