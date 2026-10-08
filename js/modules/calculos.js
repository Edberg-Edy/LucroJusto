// Contas do LucroJusto. São funções puras: não mexem em tela nem em Firebase, só recebem números e devolvem números.
// (Na Etapa 4 este arquivo ganha o cálculo completo do dia.)

// Custo de manutenção por km: soma de (preço da peça ÷ quantos km ela dura), com 3 casas decimais.
export function manutencaoPorKm(manutencao) {
  const soma = manutencao.reduce((total, x) => total + (x.duracaoKm > 0 ? x.preco / x.duracaoKm : 0), 0);
  return Math.round(soma * 1000) / 1000;
}

// Gasto de combustível por km rodado.
export function combustivelPorKm(kmPorLitro, precoLitro) {
  return kmPorLitro > 0 ? precoLitro / kmPorLitro : 0;
}

// Parte dos custos fixos que cabe a cada dia trabalhado.
export function fixoPorDia(fixos, diasPorMes) {
  const totalMensal = fixos.reduce((total, x) => total + x.valorMensal, 0);
  return diasPorMes > 0 ? totalMensal / diasPorMes : 0;
}