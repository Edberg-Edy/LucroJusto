// Funções pequenas de formatação e leitura, usadas em várias telas.

// Data de hoje no formato do campo de data (aaaa-mm-dd), pelo relógio do aparelho.
export function hojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// "2026-10-08" vira "08/10/2026".
export function dataBR(iso) {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

// Lê um número digitado (aceita vírgula ou ponto). Se estiver vazio, inválido ou negativo, devolve null.
export function lerNumero(texto) {
  const n = parseFloat(String(texto).replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

// Igual ao anterior, mas devolve 0 no lugar de null.
export const numero = (texto) => lerNumero(texto) ?? 0;

export const dinheiro = (n) =>
  'R$ ' + (Number(n) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Protege o HTML quando um texto digitado pelo usuário é colocado na tela.
export const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');