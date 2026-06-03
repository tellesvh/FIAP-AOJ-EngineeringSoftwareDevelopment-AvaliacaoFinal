import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pet } from '../domain/entities/pet.entity';
import { HealthRecord } from '../domain/entities/health-record.entity';
import { PetRepository } from '../infrastructure/repositories/pet.repository';
import { HealthRecordRepository } from '../infrastructure/repositories/health-record.repository';
import { PET_REPOSITORY } from '../domain/interfaces/pet.repository.interface';
import { HEALTH_RECORD_REPOSITORY } from '../domain/interfaces/health-record.repository.interface';
import { PetsController } from '../presentation/controllers/pets.controller';

/**
 * Módulo do bounded context Cadastro de Pets.
 *
 * Padrão SOLID DIP: os tokens PET_REPOSITORY e HEALTH_RECORD_REPOSITORY
 * são exportados para que outros módulos dependam das abstrações,
 * não das implementações concretas TypeORM.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Pet, HealthRecord])],
  controllers: [PetsController],
  providers: [
    { provide: PET_REPOSITORY, useClass: PetRepository },
    { provide: HEALTH_RECORD_REPOSITORY, useClass: HealthRecordRepository },
  ],
  exports: [PET_REPOSITORY, HEALTH_RECORD_REPOSITORY],
})
export class PetsModule {}
