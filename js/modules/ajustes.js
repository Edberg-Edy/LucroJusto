// Tela de Ajustes: dados da moto, manutenção, custos fixos e plataformas.
// Cada alteração é salva sozinha no Firestore (não existe botão "Salvar").
import { carregarConfig, salvarConfig } from '../services/dados.js';
import { manutencaoPorKm, combustivelPorKm, fixoPorDia } from './calculos.js';

const dinheiro = (n) =>
  'R$ ' + (Number(n) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dinheiro3 = (n) =>
  'R$ ' + (Number(n) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
// Aceita vírgula ou ponto e nunca devolve negativo
const numero = (t) => Math.max(0, parseFloat(String(t).replace(',', '.')) || 0);

// Campos numéricos simples: [nome no banco, rótulo na tela]
const campos = [
  ['meta', 'Meta diária de lucro (R$)'],
  ['kmPorLitro', 'Km por litro da moto'],
  ['precoLitro', 'Preço do litro (R$)'],
  ['diasPorMes', 'Dias trabalhados por mês'],
  ['limiteMei', 'Limite anual de faturamento do MEI (R$)'],
];

// "caixa" é o espaço da tela onde os Ajustes aparecem; "usuario" é quem está logado.
export async function telaAjustes(caixa, usuario) {
  caixa.innerHTML = '<p class="suave">Carregando ajustes…</p>';

  let config;
  try {
    config = await carregarConfig(usuario.uid);
  } catch (e) {
    caixa.innerHTML = `<section class="cartao"><h1>Ajustes</h1>
      <p class="erro">Não foi possível carregar os ajustes (${esc(e.code || 'erro')}). Confira a internet e as regras do Firestore.</p></section>`;
    return;
  }

  let status = '';

  function mostrarStatus(texto) {
    status = texto;
    const el = caixa.querySelector('#status');
    if (el) el.textContent = texto;
  }

  async function salvar() {
    mostrarStatus('Salvando…');
    try {
      await salvarConfig(usuario.uid, config);
      mostrarStatus('Salvo ✓');
    } catch (e) {
      mostrarStatus('Não foi possível salvar. Tente de novo.');
    }
  }

  // Atualiza só os números calculados, sem redesenhar a tela (assim o teclado não fecha).
  function atualizarResumos() {
    const manut = manutencaoPorKm(config.manutencao);
    const comb = combustivelPorKm(config.kmPorLitro, config.precoLitro);
    const valores = {
      manut: dinheiro3(manut),
      comb: dinheiro3(comb),
      total: dinheiro3(manut + comb),
      fixo: dinheiro(fixoPorDia(config.fixos, config.diasPorMes)),
    };
    caixa.querySelectorAll('[data-resumo]').forEach((el) => {
      el.textContent = valores[el.dataset.resumo];
    });
  }

  const linhaResumo = (rotulo, chave, destaque = '') =>
    `<div class="resumo ${destaque}"><span>${rotulo}</span><b data-resumo="${chave}"></b></div>`;

  function desenhar() {
    caixa.innerHTML = `
      <section class="cartao">
        <h1>Ajustes</h1>
        <p class="suave" id="status" role="status">${status}</p>
        ${campos
          .map(
            ([chave, rotulo]) =>
              `<label>${rotulo}<input type="text" inputmode="decimal" data-num data-k="${chave}" value="${config[chave]}"></label>`
          )
          .join('')}
      </section>

      <section class="cartao">
        <h2>Manutenção da moto</h2>
        <p class="suave">Preço da peça e quantos km ela dura. O app soma o custo por km.</p>
        <div class="linha l3 cab"><span>Item</span><span>Preço (R$)</span><span>Dura (km)</span><span></span></div>
        ${config.manutencao
          .map(
            (m, i) => `
          <div class="linha l3">
            <input type="text" data-k="manutencao.${i}.item" value="${esc(m.item)}" aria-label="Item">
            <input type="text" inputmode="decimal" data-num data-k="manutencao.${i}.preco" value="${m.preco}" aria-label="Preço">
            <input type="text" inputmode="decimal" data-num data-k="manutencao.${i}.duracaoKm" value="${m.duracaoKm}" aria-label="Duração em km">
            <button type="button" class="x" data-acao="remover:manutencao:${i}" aria-label="Excluir item">✕</button>
          </div>`
          )
          .join('')}
        <button type="button" class="botao secundario" data-acao="adicionar:manutencao">+ Item</button>
        ${linhaResumo('Manutenção por km', 'manut')}
        ${linhaResumo('Combustível por km', 'comb')}
        ${linhaResumo('Custo total por km da moto', 'total', 'total')}
      </section>

      <section class="cartao">
        <h2>Custos fixos mensais</h2>
        <p class="suave">Valor por mês. O app divide pelos dias trabalhados e desconta de cada dia.</p>
        <div class="linha l2 cab"><span>Item</span><span>Valor mensal (R$)</span><span></span></div>
        ${config.fixos
          .map(
            (f, i) => `
          <div class="linha l2">
            <input type="text" data-k="fixos.${i}.item" value="${esc(f.item)}" aria-label="Item">
            <input type="text" inputmode="decimal" data-num data-k="fixos.${i}.valorMensal" value="${f.valorMensal}" aria-label="Valor mensal">
            <button type="button" class="x" data-acao="remover:fixos:${i}" aria-label="Excluir custo">✕</button>
          </div>`
          )
          .join('')}
        <button type="button" class="botao secundario" data-acao="adicionar:fixos">+ Custo fixo</button>
        ${linhaResumo('Custo fixo por dia trabalhado', 'fixo', 'total')}
      </section>

      <section class="cartao">
        <h2>Plataformas</h2>
        ${config.plataformas
          .map(
            (p, i) => `
          <div class="linha l1">
            <input type="text" data-k="plataformas.${i}" value="${esc(p)}" aria-label="Nome da plataforma">
            <button type="button" class="x" data-acao="remover:plataformas:${i}" aria-label="Excluir plataforma">✕</button>
          </div>`
          )
          .join('')}
        <button type="button" class="botao secundario" data-acao="adicionar:plataformas">+ Plataforma</button>
      </section>`;
    atualizarResumos();
  }

  // Quando o usuário termina de editar um campo (sai dele ou confirma)
  caixa.addEventListener('change', (evento) => {
    const campo = evento.target.closest('[data-k]');
    if (!campo) return;

    const caminho = campo.dataset.k.split('.'); // ex.: "manutencao.2.preco" vira ['manutencao', '2', 'preco']
    let valor = campo.hasAttribute('data-num') ? numero(campo.value) : campo.value.trim();

    if (valor === '') { // nome vazio não vale: volta ao valor anterior
      desenhar();
      return;
    }
    if (campo.dataset.k === 'diasPorMes') valor = Math.max(1, Math.round(valor));

    let alvo = config;
    for (let i = 0; i < caminho.length - 1; i++) alvo = alvo[caminho[i]];
    alvo[caminho[caminho.length - 1]] = valor;

    if (campo.hasAttribute('data-num')) campo.value = valor; // mostra o valor já corrigido
    atualizarResumos();
    salvar();
  });

  // Botões de adicionar (+) e excluir (✕)
  caixa.addEventListener('click', (evento) => {
    const botao = evento.target.closest('[data-acao]');
    if (!botao) return;

    const [acao, lista, posicao] = botao.dataset.acao.split(':');
    const modelos = {
      manutencao: { item: 'Novo item', preco: 0, duracaoKm: 10000 },
      fixos: { item: 'Novo custo', valorMensal: 0 },
      plataformas: 'Nova plataforma',
    };

    if (acao === 'adicionar') config[lista].push(modelos[lista]);
    if (acao === 'remover') config[lista].splice(Number(posicao), 1);

    desenhar();
    salvar();
  });

  desenhar();
}