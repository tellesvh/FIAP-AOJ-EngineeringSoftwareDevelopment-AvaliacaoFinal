import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { RecordType } from '../enums/record-type.enum';
import { Pet } from './pet.entity';

/**
 * RegistroSanitario: evento de saúde do animal
 * (vacinação antirrábica, sorologia, vermífugos, antipulgas).
 * Utilizado pelo motor CaaS para avaliar o período de carência sanitária exigido por destino e emitir o PetPass.
 */
@Entity('health_records')
export class HealthRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  recordType: RecordType;

  @Column({ type: 'date' })
  appliedAt: string;

  @Column({ type: 'varchar', nullable: true })
  veterinarianId: string | null;

  @Column({ type: 'varchar', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Pet, (pet) => pet.healthRecords)
  @JoinColumn({ name: 'petId' })
  pet: Pet;

  @Column()
  petId: string;
}
