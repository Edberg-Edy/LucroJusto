// Aba Hoje. Etapa 5: abrir o dia (data + odômetro) e lançar despesas.
// (O fechamento do dia, com ganhos e resultado, chega na Etapa 6.)
import { buscarDiaAberto, criarDia, atualizarDia, excluirDia } from '../services/dias.js';
import { hojeISO, dataBR, lerNumero, dinheiro, esc } from './formatos.js';

const categorias = ['Comida', 'Manutenção', 'Estacionamento', 'Multa', 'Outros'];

// "caixa" é o espaço da tela onde a aba aparece; "usuario" é quem está logado.
export async function telaHoje(caixa, usuario) {
  caixa.innerHTML = '<p class="suave">Carregando…</p>';

  let dia;
  try {
    dia = await buscarDiaAberto(usuario.uid);
  } catch (e) {
    caixa.innerHTML = `<section class="cartao"><h1>Hoje</h1>
      <p class="erro">Não foi possível carregar o dia (${esc(e.code || 'erro')}). Confira a internet.</p></section>`;
    return;
  }

  let categoria = categorias[0]; // categoria de despesa selecionada
  let confirmarDescarte = false; // true depois do primeiro toque em "Descartar este dia"

  const mostrarErro = (texto) => {
    const el = caixa.querySelector('#erro');
    if (el) el.textContent = texto;
  };

  function desenhar() {
    if (dia) desenharDiaAberto();
    else desenharAbrir();
  }

  function desenharAbrir() {
    caixa.innerHTML = `
      <section class="cartao">
        <h1>Abrir o dia</h1>
        <label>Data do dia
          <input type="date" id="data" value="${hojeISO()}" max="${hojeISO()}">
        </label>
        <label>Odômetro no início (km)
          <input type="text" inputmode="decimal" id="odometro" placeholder="Ex.: 12450">
        </label>
        <p class="erro" id="erro" role="alert"></p>
        <button type="button" class="botao" data-acao="abrir">Abrir o dia</button>
        <p class="suave" style="margin-top:12px">Esqueceu de lançar um dia? Troque a data acima.</p>
      </section>`;
  }

  function desenharDiaAberto() {
    const total = dia.despesas.reduce((soma, d) => soma + d.valor, 0);

    caixa.innerHTML = `
      <section class="cartao">
        <h1>Dia aberto: ${dataBR(dia.data)}</h1>
        <p class="suave">Odômetro inicial: ${dia.odometroInicial} km</p>
      </section>

      <section class="cartao">
        <h2>Despesas do dia</h2>
        <div class="chips">
          ${categorias
            .map(
              (c) =>
                `<button type="button" class="chip" data-categoria="${c}" aria-pressed="${c === categoria}">${c}</button>`
            )
            .join('')}
        </div>
        <div class="linha-acao">
          <input type="text" inputmode="decimal" id="valor" placeholder="Valor R$" aria-label="Valor da despesa">
          <button type="button" data-acao="lancar">Lançar</button>
        </div>
        <p class="erro" id="erro" role="alert"></p>
        ${dia.despesas
          .map(
            (d, i) => `
          <div class="item">
            <span>${esc(d.categoria)}</span>
            <b>${dinheiro(d.valor)}</b>
            <button type="button" class="x" data-remover="${i}" aria-label="Excluir despesa">✕</button>
          </div>`
          )
          .join('')}
        <div class="resumo total"><span>Total de despesas</span><b>${dinheiro(total)}</b></div>
      </section>

      <section class="cartao">
        <button type="button" class="botao secundario" data-acao="descartar">
          ${confirmarDescarte ? 'Toque de novo para descartar o dia' : 'Descartar este dia'}
        </button>
      </section>`;
  }

  // Grava a nova lista de despesas e só atualiza a tela se a gravação deu certo.
  async function gravarDespesas(novas) {
    try {
      await atualizarDia(usuario.uid, dia.id, { despesas: novas });
      dia.despesas = novas;
      desenhar();
    } catch (e) {
      mostrarErro('Não foi possível salvar. Confira a internet e tente de novo.');
    }
  }

  async function abrir() {
    const data = caixa.querySelector('#data').value;
    const odometro = lerNumero(caixa.querySelector('#odometro').value);

    if (!data || data > hojeISO()) return mostrarErro('Escolha uma data válida (hoje ou anterior).');
    if (odometro === null) return mostrarErro('Digite o odômetro inicial.');

    try {
      dia = await criarDia(usuario.uid, { data, odometroInicial: odometro });
      desenhar();
    } catch (e) {
      mostrarErro('Não foi possível abrir o dia. Confira a internet e tente de novo.');
    }
  }

  function lancar() {
    const valor = lerNumero(caixa.querySelector('#valor').value);
    if (!valor) return mostrarErro('Digite um valor maior que zero.');
    gravarDespesas([...dia.despesas, { categoria, valor }]);
  }

  async function descartar() {
    if (!confirmarDescarte) {
      confirmarDescarte = true;
      desenhar();
      setTimeout(() => {
        if (confirmarDescarte && dia) {
          confirmarDescarte = false;
          desenhar();
        }
      }, 4000);
      return;
    }
    try {
      await excluirDia(usuario.uid, dia.id);
      dia = null;
      confirmarDescarte = false;
      desenhar();
    } catch (e) {
      mostrarErro('Não foi possível descartar. Tente de novo.');
    }
  }

  caixa.addEventListener('click', (evento) => {
    const botao = evento.target.closest('button');
    if (!botao) return;

    if (botao.dataset.categoria) {
      categoria = botao.dataset.categoria;
      caixa.querySelectorAll('[data-categoria]').forEach((b) => {
        b.setAttribute('aria-pressed', String(b.dataset.categoria === categoria));
      });
    } else if (botao.dataset.remover !== undefined) {
      gravarDespesas(dia.despesas.filter((_, i) => i !== Number(botao.dataset.remover)));
    } else if (botao.dataset.acao === 'abrir') abrir();
    else if (botao.dataset.acao === 'lancar') lancar();
    else if (botao.dataset.acao === 'descartar') descartar();
  });

  // Enter nos campos de texto faz a mesma coisa que o botão ao lado
  caixa.addEventListener('keydown', (evento) => {
    if (evento.key !== 'Enter') return;
    if (evento.target.id === 'valor') lancar();
    if (evento.target.id === 'odometro') abrir();
  });

  desenhar();
}