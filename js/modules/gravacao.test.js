// Testes da gravação sem travar. Para rodar: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gravar } from './gravacao.js';

const depois = (ms, valor, falha = false) =>
  new Promise((resolve, reject) => setTimeout(() => (falha ? reject(valor) : resolve(valor)), ms));

test('servidor confirma a tempo: sincronizado', async () => {
  assert.deepEqual(await gravar(depois(5, 'ok'), 100), { sincronizado: true });
});

test('servidor demora: segue em frente como pendente', async () => {
  const inicio = Date.now();
  assert.deepEqual(await gravar(depois(300, 'ok'), 30), { sincronizado: false });
  assert.ok(Date.now() - inicio < 200, 'não deveria esperar o servidor');
});

test('servidor recusa a tempo: o erro chega a quem chamou', async () => {
  const erro = new Error('permission-denied');
  await assert.rejects(gravar(depois(5, erro, true), 100), (e) => e === erro);
});

test('recusa depois do prazo não derruba o app', async () => {
  const resultado = await gravar(depois(60, new Error('tarde'), true), 20);
  assert.deepEqual(resultado, { sincronizado: false });
  await depois(80, null); // dá tempo da recusa tardia acontecer sem erro não tratado
});
