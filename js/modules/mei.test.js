// Testes do limite do MEI. Para rodar: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { faturadoNoAno, usoDoLimite } from './mei.js';

const dia = (data, faturamento) => ({ data, calculados: { faturamento } });

test('faturado no ano soma só o ano pedido', () => {
  const dias = [dia('2026-01-10', 100), dia('2026-12-31', 50), dia('2025-12-31', 999), dia('2027-01-01', 999)];
  assert.equal(faturadoNoAno(dias, 2026), 150);
  assert.equal(faturadoNoAno(dias, 2030), 0);
});

test('uso do limite: percentual e quanto resta', () => {
  const r = usoDoLimite(20250, 81000);
  assert.equal(r.percentual, 25);
  assert.equal(r.restante, 60750);
  assert.equal(r.estourou, false);
});

test('passou do limite: barra em 100% e nada restando', () => {
  const r = usoDoLimite(90000, 81000);
  assert.equal(r.percentual, 100);
  assert.equal(r.restante, 0);
  assert.equal(r.estourou, true);
});

test('limite zero não divide por zero', () => {
  const r = usoDoLimite(100, 0);
  assert.equal(r.percentual, 0);
  assert.equal(r.estourou, false);
});