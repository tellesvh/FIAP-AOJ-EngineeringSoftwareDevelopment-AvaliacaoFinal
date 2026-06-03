import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Pet } from '../../domain/entities/pet.entity';
import { HealthRecord } from '../../domain/entities/health-record.entity';
import { PetPass } from '../../domain/entities/pet-pass.entity';
import { DestinationRule } from '../../domain/entities/destination-rule.entity';

/**
 * Configuração do TypeORM com driver sql.js (SQLite puro JavaScript).
 *
 * Padrão SOLID LSP (Liskov Substitution): em ambiente de teste (NODE_ENV=test)
 * o banco opera em memória — sem arquivo, sem estado entre testes.
 * Em ambiente de desenvolvimento, persiste em arquivo local (petpass.sqlite).
 * Ambos os modos usam os mesmos repositórios sem qualquer alteração de código.
 */
export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'sqljs',
  location: process.env.NODE_ENV === 'test' ? undefined : 'petpass.sqlite',
  autoSave: process.env.NODE_ENV !== 'test',
  entities: [Pet, HealthRecord, PetPass, DestinationRule],
  synchronize: true,
  logging: false,
};
