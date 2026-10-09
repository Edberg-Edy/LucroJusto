// Contas do limite anual do MEI. Funções puras, testadas em mei.test.js.

// Soma o faturamento dos dias fechados do ano informado (conta só o que foi lançado no app).
export function faturadoNoAno(dias, ano) {
  return dias
    .filter((d) => d.data.startsWith(String(ano)))
    .reduce((total, d) => total + d.calculados.faturamento, 0);
}

// Quanto do limite já foi usado e quanto resta. O percentual para em 100 para a barra não passar do fim.
export function usoDoLimite(faturado, limite) {
  return {
    percentual: limite > 0 ? Math.min(100, (faturado / limite) * 100) : 0,
    restante: Math.max(0, limite - faturado),
    estourou: limite > 0 && faturado > limite,
  };
}