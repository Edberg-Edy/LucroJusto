// Testes do fechamento mensal. Para rodar: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { somarMeses, nomeDoMes, ultimoDiaDoMes, mesJaTerminou, resumoDoMes } from './mes.js';

// Dia fechado de exemplo (só os campos que o resumo usa)
const dia = (data, lucro, plataformas = [{ nome: 'iFood', valor: 100, corridas: 4 }]) => ({
  data,
  plataformas,
  calculados: { faturamento: lucro + 50, combustivel: 20, manutencao: 15, despesas: 10, fixos: 5, gastos: 50, lucro, guardar: 20, km: 100 },
});

test('somar meses passa de ano', () => {
  assert.equal(somarMeses('2026-12', 1), '2027-01');
  assert.equal(somarMeses('2026-01', -1), '2025-12');
  assert.equal(somarMeses('2026-10', 0), '2026-10');
});

test('nome do mês e último dia do mês', () => {
  assert.equal(nomeDoMes('2026-10'), 'outubro de 2026');
  assert.equal(nomeDoMes('2026-03'), 'março de 2026');
  assert.equal(ultimoDiaDoMes('2026-02'), 28);
  assert.equal(ultimoDiaDoMes('2028-02'), 29);
  assert.equal(ultimoDiaDoMes('2026-09'), 30);
  assert.equal(ultimoDiaDoMes('2026-10'), 31);
});

test('só dá para fechar mês que já terminou (ou no último dia)', () => {
  assert.equal(mesJaTerminou('2026-09', '2026-10-09'), true);
  assert.equal(mesJaTerminou('2026-10', '2026-10-09'), false);
  assert.equal(mesJaTerminou('2026-10', '2026-10-31'), true);
  assert.equal(mesJaTerminou('2026-11', '2026-10-31'), false);
});

test('resumo do mês soma só o mês, junta datas repetidas e acha melhor e pior dia', () => {
  const dias = [dia('2026-10-05', 100), dia('2026-10-06', 250), dia('2026-10-06', -50), dia('2026-09-30', 999)];
  const r = resumoDoMes(dias, '2026-10');
  const t = r.totais;
  assert.equal(t.lucro, 300);
  assert.equal(t.faturamento, 450);
  assert.equal(t.gastos, 150);
  assert.equal(t.combustivel, 60);
  assert.equal(t.guardar, 60);
  assert.equal(t.km, 300);
  assert.equal(t.diasTrabalhados, 2); // 05 e 06
  assert.equal(t.mediaPorDia, 150);
  assert.equal(t.ganhoPorKm, 1.5);
  assert.equal(t.corridas, 12);
  assert.equal(t.ganhoPorCorrida, 25);
  assert.deepEqual(r.melhor, { data: '2026-10-06', lucro: 200 });
  assert.deepEqual(r.pior, { data: '2026-10-05', lucro: 100 });
  assert.equal(r.plataformas[0].nome, 'iFood');
});

test('mês sem dias: tudo zerado e indicadores vazios', () => {
  const r = resumoDoMes([dia('2026-09-30', 100)], '2026-10');
  assert.equal(r.totais.lucro, 0);
  assert.equal(r.totais.mediaPorDia, null);
  assert.equal(r.totais.ganhoPorKm, null);
  assert.equal(r.totais.ganhoPorCorrida, null);
  assert.equal(r.melhor, null);
  assert.equal(r.pior, null);
});

test('com um dia só, melhor e pior são o mesmo', () => {
  const r = resumoDoMes([dia('2026-10-05', 80)], '2026-10');
  assert.deepEqual(r.melhor, r.pior);
});

test('ganho por corrida ignora plataformas sem corridas informadas', () => {
  const r = resumoDoMes([dia('2026-10-05', 80, [{ nome: 'A', valor: 100, corridas: 4 }, { nome: 'B', valor: 60 }])], '2026-10');
  assert.equal(r.totais.ganhoPorCorrida, 25);
});