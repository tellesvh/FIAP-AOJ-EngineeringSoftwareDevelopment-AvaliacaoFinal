import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { ComplianceStatusValue } from '../enums/compliance-status.enum';
import { Pet } from './pet.entity';

/**
 * Smart Pet Pass: passaporte digital que atesta o StatusCompliance do animal
 * para um Destino específico, resultado do motor CaaS (Compliance as a Service).
 *
 * Padrão GRASP Information Expert: isExpired() implementado diretamente nesta
 * entidade porque ela própria possui os dados necessários para a verificação.
 */
@Entity('pet_passes')
export class PetPass {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  complianceStatus: ComplianceStatusValue;

  /** Motivo do status Inapto (ComplianceReprovado), quando aplicável. */
  @Column({ type: 'varchar', nullable: true })
  reason: string | null;

  /** Data a partir da qual o animal estará Apto, quando Inapto. */
  @Column({ type: 'date', nullable: true })
  releaseDate: string | null;

  /** Código do destino para o qual o compliance foi avaliado (ex: "BR", "EU", "JP").
   * Cada código possui um período de carência sanitária específico. */
  @Column()
  destinationCode: string;

  @CreateDateColumn()
  issuedAt: Date;

  /** Data de expiração do PetPass (90 dias após a emissão, por padrão). */
  @Column({ type: 'date' })
  expiresAt: string;

  @ManyToOne(() => Pet, (pet) => pet.petPasses)
  @JoinColumn({ name: 'petId' })
  pet: Pet;

  @Column()
  petId: string;

  /**
   * Verifica se o PetPass está expirado.
   * Padrão GRASP Information Expert: o PetPass conhece sua própria data de expiração.
   */
  isExpired(): boolean {
    return new Date() > new Date(this.expiresAt);
  }
}
