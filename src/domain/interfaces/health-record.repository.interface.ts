import { HealthRecord } from '../entities/health-record.entity';

/**
 * Interface de repositório para RegistroSanitario.
 *
 * Padrão SOLID ISP: segregada de IPetRepository para que o ComplianceEngineService
 * injete apenas esta interface, sem acoplar-se às operações de Pet.
 */
export interface IHealthRecordRepository {
  save(record: Omit<HealthRecord, 'id' | 'createdAt' | 'pet'>): Promise<HealthRecord>;
  findByPetId(petId: string): Promise<HealthRecord[]>;
}

export const HEALTH_RECORD_REPOSITORY = Symbol('IHealthRecordRepository');
