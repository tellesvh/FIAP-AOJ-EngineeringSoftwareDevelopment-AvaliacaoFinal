/**
 * Retorna a diferença em dias inteiros entre duas datas (from − to).
 * Utilizado pelo ComplianceEngineService para calcular o waiting period
 * (período de carência) entre a data de aplicação do registro e a data de referência.
 */
export function differenceInDays(from: Date, to: Date): number {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const utcFrom = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const utcTo = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.floor((utcFrom - utcTo) / MS_PER_DAY);
}
