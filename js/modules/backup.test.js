// Testes do backup. Para rodar: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { montarBackup } from './backup.js';

test('backup traz identificação, config e dias em ordem de data', () => {
  const b = montarBackup({ meta: 200 }, [{ data: '2026-10-08' }, { data: '2026-10-01' }], new Date('2026-10-08T12:00:00Z'));
  assert.equal(b.app, 'LucroJusto');
  assert.equal(b.versao, 1);
  assert.equal(b.exportadoEm, '2026-10-08T12:00:00.000Z');
  assert.equal(b.config.meta, 200);
  assert.deepEqual(b.dias.map((d) => d.data), ['2026-10-01', '2026-10-08']);
});

test('montar o backup não altera a lista original', () => {
  const dias = [{ data: '2026-10-08' }, { data: '2026-10-01' }];
  montarBackup({}, dias);
  assert.equal(dias[0].data, '2026-10-08');
});