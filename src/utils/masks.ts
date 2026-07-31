/**
 * Máscaras de digitação para campos de data e hora.
 *
 * Sem elas o usuário digita "01072026" e o valor nunca casa com o formato
 * esperado (DD/MM/AAAA), fazendo o botão de salvar ficar permanentemente
 * desabilitado — sem nenhuma pista visual do porquê.
 */

/** Formata enquanto digita: 01072026 → 01/07/2026 */
export function maskDate(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/** Formata enquanto digita: 1930 → 19:30 */
export function maskTime(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

/** Valida DD/MM/AAAA de verdade — rejeita 31/02, mês 13, etc. */
export function isValidDate(value: string): boolean {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return false;
  const [, d, m, y] = match;
  const dia = Number(d);
  const mes = Number(m);
  const ano = Number(y);
  if (mes < 1 || mes > 12) return false;
  if (ano < 1900 || ano > 2200) return false;
  const diasNoMes = new Date(ano, mes, 0).getDate();
  return dia >= 1 && dia <= diasNoMes;
}

/** Valida HH:MM (00:00 a 23:59). */
export function isValidTime(value: string): boolean {
  const match = /^(\d{2}):(\d{2})$/.exec(value.trim());
  if (!match) return false;
  const [, h, min] = match;
  return Number(h) <= 23 && Number(min) <= 59;
}
