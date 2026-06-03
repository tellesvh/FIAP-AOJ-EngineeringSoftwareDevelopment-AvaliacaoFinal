import { DestinationRule } from '../entities/destination-rule.entity';

/**
 * Interface de repositório para RegraDestino.
 *
 * Padrão SOLID ISP: o ComplianceEngineService injeta apenas esta interface
 * para consultar o waiting period (período de carência) por país de destino,
 * sem depender de nenhuma outra operação de repositório.
 */
export interface IDestinationRuleRepository {
  findByCode(destinationCode: string): Promise<DestinationRule | null>;
  findAll(): Promise<DestinationRule[]>;
}

export const DESTINATION_RULE_REPOSITORY = Symbol('IDestinationRuleRepository');
