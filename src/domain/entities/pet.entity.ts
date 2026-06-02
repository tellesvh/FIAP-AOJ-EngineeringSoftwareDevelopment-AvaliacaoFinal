import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { SpeciesType } from '../enums/species-type.enum';
import { HealthRecord } from './health-record.entity';
import { PetPass } from './pet-pass.entity';

/**
 * Entidade central do cadastro de animais de estimação.
 * Representa o Pet que será submetido ao processo de compliance sanitário (CaaS).
 */
@Entity('pets')
export class Pet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'varchar' })
  speciesType: SpeciesType;

  @Column({ type: 'date' })
  birthDate: string;

  @Column({ unique: true })
  microchip: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => HealthRecord, (record) => record.pet, { cascade: true })
  healthRecords: HealthRecord[];

  @OneToMany(() => PetPass, (pass) => pass.pet)
  petPasses: PetPass[];
}
