/**
 * Converte uma string no formato "YYYY-MM-DD" para um Date local (meia-noite).
 *
 * Strings de data puras são interpretadas como UTC pelo JavaScript,
 * o que causa deslocamento de um dia em fusos negativos (ex: UTC-3 no Brasil).
 * Este parser cria o Date diretamente no fuso local, evitando o problema.
 */
export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

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
