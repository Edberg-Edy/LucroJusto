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
// ---------- validação e restauração ----------
import { validarBackup, prepararRestauracao } from './backup.js';

const diaOk = (id, data) => ({
  id, data, aberto: false, odometroInicial: 100, odometroFinal: 200, horas: 8,
  plataformas: [], despesas: [], snapshot: { meta: 150 }, calculados: { lucro: 50 },
  criadoEm: { seconds: 1 }, fechadoEm: { seconds: 2 },
});
const backupOk = () => ({
  app: 'LucroJusto', versao: 1,
  config: { meta: 150, kmPorLitro: 25, precoLitro: 6, diasPorMes: 26, limiteMei: 81000, plataformas: [], manutencao: [], fixos: [] },
  dias: [diaOk('a', '2026-10-02'), diaOk('b', '2026-10-01'), { id: 'c', data: '2026-10-03', aberto: true, odometroInicial: 5 }],
  meses: { '2026-09': { fechado: true, fechadoEm: { seconds: 3 } } },
});

test('backup válido é aceito e resumido', () => {
  const r = validarBackup(backupOk());
  assert.equal(r.ok, true);
  assert.deepEqual(r.resumo, { dias: 2, abertos: 1, meses: 1, de: '2026-10-01', ate: '2026-10-02' });
});

test('backup antigo sem "meses" continua válido', () => {
  const b = backupOk();
  delete b.meses;
  assert.equal(validarBackup(b).ok, true);
});

test('arquivos que não são backup ou estão quebrados são recusados', () => {
  assert.equal(validarBackup(null).ok, false);
  assert.equal(validarBackup({ app: 'Outro' }).ok, false);
  assert.equal(validarBackup({ ...backupOk(), versao: 2 }).ok, false);
  assert.equal(validarBackup({ ...backupOk(), config: { meta: 'x' } }).ok, false);

  const dataRuim = backupOk();
  dataRuim.dias[0].data = '02/10/2026';
  assert.equal(validarBackup(dataRuim).ok, false);

  const idRuim = backupOk();
  idRuim.dias[0].id = 'a/b'; // barra mudaria o caminho no banco
  assert.equal(validarBackup(idRuim).ok, false);

  const odometro = backupOk();
  odometro.dias[0].odometroFinal = 50;
  assert.equal(validarBackup(odometro).ok, false);

  const mesRuim = backupOk();
  mesRuim.meses = { outubro: {} };
  assert.equal(validarBackup(mesRuim).ok, false);
});

test('preparar a restauração ignora dia aberto e tira código e carimbos', () => {
  const p = prepararRestauracao(backupOk());
  assert.deepEqual(p.dias.map((d) => d.id), ['a', 'b']);
  assert.equal('id' in p.dias[0].campos, false);
  assert.equal('criadoEm' in p.dias[0].campos, false);
  assert.equal('fechadoEm' in p.dias[0].campos, false);
  assert.equal(p.dias[0].campos.data, '2026-10-02');
  assert.deepEqual(p.meses, [{ ym: '2026-09', campos: { fechado: true } }]);
  assert.equal(p.config.meta, 150);
});
