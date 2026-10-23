// Backup dos dados do usuário em um arquivo .json, e restauração a partir dele.
// As funções de montar, validar e preparar são puras (testadas em backup.test.js).
import { hojeISO } from './formatos.js';

const DATA = /^\d{4}-\d{2}-\d{2}$/;
const MES = /^\d{4}-\d{2}$/;
const numero = (n) => typeof n === 'number' && Number.isFinite(n);
const objeto = (o) => o !== null && typeof o === 'object' && !Array.isArray(o);

// Monta o conteúdo do backup. Os dias saem em ordem de data. "meses" são os fechamentos e checklists (opcional).
export function montarBackup(config, dias, agora = new Date(), meses = {}) {
  return {
    app: 'LucroJusto',
    versao: 1,
    exportadoEm: agora.toISOString(),
    config,
    dias: [...dias].sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0)),
    meses,
  };
}

// Faz o navegador baixar o arquivo. O nome usa a data de hoje no horário do aparelho.
export function baixarBackup(backup) {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `lucrojusto-backup-${hojeISO()}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Confere se o arquivo escolhido é mesmo um backup do LucroJusto e se está inteiro.
// Devolve { ok: true, resumo } ou { ok: false, erro } com uma frase pronta para mostrar na tela.
export function validarBackup(b) {
  const falha = (erro) => ({ ok: false, erro });
  if (!objeto(b) || b.app !== 'LucroJusto') return falha('Este arquivo não é um backup do LucroJusto.');
  if (b.versao !== 1) return falha('Versão de backup não reconhecida. Use um backup gerado por este app.');

  const c = b.config;
  if (!objeto(c)) return falha('O backup está sem os ajustes.');
  for (const campo of ['meta', 'kmPorLitro', 'precoLitro', 'diasPorMes', 'limiteMei']) {
    if (!numero(c[campo])) return falha(`Ajuste inválido no backup: ${campo}.`);
  }
  for (const lista of ['plataformas', 'manutencao', 'fixos']) {
    if (!Array.isArray(c[lista])) return falha(`Ajuste inválido no backup: ${lista}.`);
  }

  if (!Array.isArray(b.dias)) return falha('O backup está sem a lista de dias.');
  for (const d of b.dias) {
    if (!objeto(d) || typeof d.id !== 'string' || !d.id || d.id.includes('/')) return falha('Há um dia sem identificação no backup.');
    if (typeof d.data !== 'string' || !DATA.test(d.data)) return falha(`Dia com data inválida no backup (${d.id}).`);
    if (!numero(d.odometroInicial)) return falha(`Dia ${d.data} sem odômetro inicial.`);
    if (d.aberto !== true) {
      if (!numero(d.odometroFinal) || d.odometroFinal <= d.odometroInicial) return falha(`Dia ${d.data} com odômetro inválido.`);
      if (!objeto(d.calculados) || !numero(d.calculados.lucro) || !objeto(d.snapshot)) return falha(`Dia ${d.data} incompleto no backup.`);
      if (!Array.isArray(d.plataformas) || !Array.isArray(d.despesas)) return falha(`Dia ${d.data} incompleto no backup.`);
    }
  }

  const meses = b.meses ?? {};
  if (!objeto(meses) || Object.keys(meses).some((ym) => !MES.test(ym) || !objeto(meses[ym]))) {
    return falha('Os meses do backup estão inválidos.');
  }

  const datas = b.dias.filter((d) => d.aberto !== true).map((d) => d.data).sort();
  return {
    ok: true,
    resumo: {
      dias: datas.length,
      abertos: b.dias.length - datas.length,
      meses: Object.keys(meses).length,
      de: datas[0] || null,
      ate: datas[datas.length - 1] || null,
    },
  };
}

// Tira do dia/mês os campos que são do próprio banco (código e carimbos de hora gerados pelo servidor).
const limpar = ({ id, criadoEm, fechadoEm, ...resto }) => resto;

// Transforma um backup já validado na lista do que será gravado.
// Dias ainda abertos ficam de fora (poderiam virar um segundo dia aberto). Nada é apagado: só se grava por cima.
export function prepararRestauracao(b) {
  return {
    config: b.config,
    dias: b.dias.filter((d) => d.aberto !== true).map((d) => ({ id: d.id, campos: limpar(d) })),
    meses: Object.entries(b.meses ?? {}).map(([ym, campos]) => ({ ym, campos: limpar(campos) })),
  };
}
