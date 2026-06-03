import { ComplianceStatusValue } from '../enums/compliance-status.enum';

/**
 * Value Object que representa o StatusCompliance de um PetPass.
 *
 * Encapsula o resultado da avaliação do motor CaaS (Compliance as a Service):
 *   ELIGIBLE   → Animal Apto para embarque no destino informado
 *   INELIGIBLE → Animal Inapto, com motivo e data de liberação estimada
 *
 * Padrão GRASP Information Expert: este VO conhece seu próprio estado e
 * expõe apenas métodos de consulta, sem permitir mutação direta.
 */
export class ComplianceStatus {
  private constructor(
    public readonly status: ComplianceStatusValue,
    public readonly reason: string | null,
    public readonly releaseDate: Date | null,
  ) { }

  static eligible(): ComplianceStatus {
    return new ComplianceStatus(ComplianceStatusValue.ELIGIBLE, null, null);
  }

  static ineligible(reason: string, releaseDate?: Date): ComplianceStatus {
    return new ComplianceStatus(
      ComplianceStatusValue.INELIGIBLE,
      reason,
      releaseDate ?? null,
    );
  }

  isEligible(): boolean {
    return this.status === ComplianceStatusValue.ELIGIBLE;
  }
}
