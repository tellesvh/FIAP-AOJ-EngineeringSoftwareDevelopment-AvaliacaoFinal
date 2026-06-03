import { Entity, PrimaryColumn, Column } from 'typeorm';

/**
 * RegraDestino: define as regras sanitárias por país/destino de viagem.
 *
 * Padrão SOLID OCP (Open/Closed): novos destinos são inseridos como registros
 * nesta tabela, sem necessidade de modificar o ComplianceEngineService.
 *
 * Regras pré-configuradas:
 *   BR — Brasil:          waiting period de 21 dias para vacina antirrábica
 *   EU — União Europeia:  waiting period de 90 dias, sorologia obrigatória
 *   JP — Japão:           waiting period de 180 dias, sorologia obrigatória
 */
@Entity('destination_rules')
export class DestinationRule {
  /** Código do país de destino (ex: "BR", "EU", "JP"). */
  @PrimaryColumn()
  destinationCode: string;

  /** Waiting period (período de carência) para a vacina antirrábica, em dias. */
  @Column()
  waitingPeriodDays: number;

  /** Indica se sorologia é obrigatória para este destino. */
  @Column({ default: false })
  serologyRequired: boolean;

  /** Waiting period (período de carência) para a sorologia, quando obrigatória, em dias. */
  @Column({ default: 0 })
  serologyWaitingPeriodDays: number;
}
