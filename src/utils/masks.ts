/**
 * Máscaras de digitação para campos de data e hora.
 *
 * Sem elas o usuário digita "01072026" e o valor nunca casa com o formato
 * esperado (DD/MM/AAAA), fazendo o botão de salvar ficar permanentemente
 * desabilitado — sem nenhuma pista visual do porquê.
 */

/** Formata enquanto digita: 01072026 → 01/07/2026 */
/**
 * Máscara de telefone brasileiro: (67) 99999-1234 e (67) 3421-1234.
 *
 * A máscara é só apresentação — o que vai para o servidor são os dígitos
 * puros (`somenteDigitos`). Gravar com parênteses e traço obrigaria toda
 * consulta e todo link de WhatsApp a limpar a string de novo, e bastaria um
 * lugar esquecer para o botão abrir conversa com número inválido.
 *
 * O nono dígito decide o formato: 11 dígitos é celular (5 + 4), 10 é fixo
 * (4 + 4). A troca acontece enquanto se digita, o que é o comportamento
 * esperado — quem digita um celular vê o formato de celular aparecer sozinho.
 */
export function maskPhone(input: string): string {
  const d = input.replace(/\D/g, '').slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function somenteDigitos(valor: string): string {
  return valor.replace(/\D/g, '');
}

/**
 * Link de conversa do WhatsApp.
 *
 * O `55` é acrescentado quando não está lá. Quem cadastra o próprio telefone
 * digita "(67) 99999-1234", não "+55" — e o `wa.me` sem código de país abre
 * uma conversa com um número que não existe, sem erro nenhum: a tela do
 * WhatsApp só diz "número inválido" e a pessoa culpa o app da igreja.
 */
export function linkWhatsapp(telefone: string): string {
  const d = somenteDigitos(telefone);
  const comPais = d.startsWith('55') ? d : `55${d}`;
  return `https://wa.me/${comPais}`;
}

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
