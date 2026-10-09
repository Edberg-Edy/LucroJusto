// Aba Hoje. Abrir o dia (data + odômetro), lançar despesas e fechar o dia com o resultado.
// Também serve para editar um dia já fechado (o Histórico reabre o dia e manda para cá).
import { buscarDiaAberto, criarDia, atualizarDia, excluirDia, fecharDia } from '../services/dias.js';
import { carregarConfig } from '../services/dados.js';
import { mesEstaFechado } from '../services/meses.js';
import { calcularDia, parametrosDoDia, lerHoras } from './calculos.js';
import { htmlResultado } from './resultado.js';
import { hojeISO, dataBR, lerNumero, dinheiro, esc } from './formatos.js';

const categorias = ['Comida', 'Manutenção', 'Estacionamento', 'Multa', 'Outros'];

// "caixa" é o espaço da tela onde a aba aparece; "usuario" é quem está logado.
export async function telaHoje(caixa, usuario) {
  caixa.innerHTML = '<p class="suave">Carregando…</p>';

  let dia; // dia aberto (ou null)
  let config; // ajustes: precisamos das plataformas e dos parâmetros para fechar o dia
  try {
    [dia, config] = await Promise.all([buscarDiaAberto(usuario.uid), carregarConfig(usuario.uid)]);
  } catch (e) {
    caixa.innerHTML = `<section class="cartao"><h1>Hoje</h1>
      <p class="erro">Não foi possível carregar o dia (${esc(e.code || 'erro')}). Confira a internet.</p></section>`;
    return;
  }

  let categoria = categorias[0]; // categoria de despesa selecionada
  let confirmarDescarte = false; // true depois do primeiro toque em "Descartar este dia"
  let resultado = null; // dia recém-fechado, mostrado até o usuário tocar em "Lançar outro dia"
  // Um dia que já tem odômetro final foi fechado antes: estamos editando.
  const emEdicao = () => dia && dia.odometroFinal !== undefined;

  // Plataformas dos ajustes + as que o dia editado já usava (mesmo que tenham sido excluídas dos ajustes depois)
  const nomesPlataformas = () => {
    const nomes = [...config.plataformas];
    ((dia && dia.plataformas) || []).forEach((p) => {
      if (!nomes.includes(p.nome)) nomes.push(p.nome);
    });
    return nomes;
  };

  // Ao editar, os campos do fechamento já vêm preenchidos com o que foi salvo.
  function rascunhoDoDia() {
    const r = { odometroFinal: String(dia.odometroFinal), horas: dia.horas ? String(dia.horas).replace('.', ',') : '' };
    nomesPlataformas().forEach((nome, i) => {
      const p = dia.plataformas.find((x) => x.nome === nome);
      r['v' + i] = p && p.valor ? String(p.valor).replace('.', ',') : '';
      r['c' + i] = p && p.corridas ? String(p.corridas) : '';
    });
    return r;
  }

  let rascunho = emEdicao() ? rascunhoDoDia() : {}; // o que já foi digitado no fechamento (não se perde ao lançar uma despesa)

  const mostrarErro = (texto, id = 'erro') => {
    const el = caixa.querySelector('#' + id);
    if (el) el.textContent = texto;
  };

  function desenhar() {
    if (resultado) desenharResultado();
    else if (dia) desenharDiaAberto();
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

  function desenharResultado() {
    caixa.innerHTML = `
      ${htmlResultado(resultado)}
      <button type="button" class="botao" data-acao="novo">Lançar outro dia</button>`;
  }

  function desenharDiaAberto() {
    const total = dia.despesas.reduce((soma, d) => soma + d.valor, 0);
    const r = (campo) => esc(rascunho[campo] || ''); // valor já digitado, para repor na tela

    caixa.innerHTML = `
      <section class="cartao">
        <h1>${emEdicao() ? 'Editando' : 'Dia aberto'}: ${dataBR(dia.data)}</h1>
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
        <h2>${emEdicao() ? 'Salvar alterações' : 'Fechar o dia'}</h2>
        <label>Odômetro no fim (km)
          <input type="text" inputmode="decimal" data-f="odometroFinal" value="${r('odometroFinal')}">
        </label>
        <label>Horas trabalhadas (opcional, ex.: 8 ou 8:30)
          <input type="text" data-f="horas" value="${r('horas')}">
        </label>
        <div class="linha l3p cab"><span>Plataforma</span><span>Ganho (R$)</span><span>Corridas</span></div>
        ${nomesPlataformas()
          .map(
            (nome, i) => `
          <div class="linha l3p">
            <b>${esc(nome)}</b>
            <input type="text" inputmode="decimal" data-f="v${i}" placeholder="0,00" aria-label="${esc(nome)}: ganho" value="${r('v' + i)}">
            <input type="text" inputmode="numeric" data-f="c${i}" placeholder="nº" aria-label="${esc(nome)}: corridas" value="${r('c' + i)}">
          </div>`
          )
          .join('')}
        <p class="erro" id="erroFechar" role="alert"></p>
        <button type="button" class="botao" data-acao="fechar">${emEdicao() ? 'Salvar alterações' : 'Fechar o dia'}</button>
      </section>

      <section class="cartao">
        ${
          emEdicao()
            ? '<button type="button" class="botao secundario" data-acao="cancelar">Cancelar edição</button>'
            : `<button type="button" class="botao secundario" data-acao="descartar">
          ${confirmarDescarte ? 'Toque de novo para descartar o dia' : 'Descartar este dia'}
        </button>`
        }
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

    // Mês fechado não aceita dias novos (reabra o mês no Histórico)
    try {
      if (await mesEstaFechado(usuario.uid, data.slice(0, 7))) {
        return mostrarErro('Este mês está fechado. Reabra o mês no Histórico para lançar dias nele.');
      }
    } catch (e) {
      return mostrarErro('Não foi possível verificar o mês. Confira a internet e tente de novo.');
    }

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

  async function fechar() {
    const erro = (texto) => mostrarErro(texto, 'erroFechar');

    const odometroFinal = lerNumero(rascunho.odometroFinal || '');
    if (odometroFinal === null || odometroFinal <= dia.odometroInicial) {
      return erro(`O odômetro final precisa ser maior que o inicial (${dia.odometroInicial} km).`);
    }

    const textoHoras = (rascunho.horas || '').trim();
    const horas = lerHoras(textoHoras);
    if (textoHoras && horas === null) return erro('Horas inválidas. Use 8, 8,5 ou 8:30.');

    // Só entram as plataformas em que houve ganho ou corridas
    const plataformas = nomesPlataformas()
      .map((nome, i) => ({
        nome,
        valor: lerNumero(rascunho['v' + i] || '') || 0,
        corridas: Math.round(lerNumero(rascunho['c' + i] || '') || 0),
      }))
      .filter((p) => p.valor > 0 || p.corridas > 0);

    // Dia novo usa os ajustes de hoje. Dia editado mantém a fotografia que ele já tinha.
    const parametros = emEdicao() && dia.snapshot ? dia.snapshot : parametrosDoDia(config);
    const calculados = calcularDia(
      { odometroInicial: dia.odometroInicial, odometroFinal, horas, plataformas, despesas: dia.despesas },
      parametros
    );

    try {
      await fecharDia(usuario.uid, dia.id, { odometroFinal, horas, plataformas, snapshot: parametros, calculados });
      resultado = { ...dia, aberto: false, odometroFinal, horas, plataformas, snapshot: parametros, calculados };
      dia = null;
      rascunho = {};
      desenhar();
    } catch (e) {
      erro('Não foi possível fechar o dia. Confira a internet e tente de novo.');
    }
  }

  // Cancela a edição: volta o dia ao estado fechado, recalculando com o que está salvo (despesas podem ter mudado).
  async function cancelarEdicao() {
    try {
      const calculados = calcularDia(
        {
          odometroInicial: dia.odometroInicial,
          odometroFinal: dia.odometroFinal,
          horas: dia.horas ?? null,
          plataformas: dia.plataformas,
          despesas: dia.despesas,
        },
        dia.snapshot
      );
      await fecharDia(usuario.uid, dia.id, {
        odometroFinal: dia.odometroFinal,
        horas: dia.horas ?? null,
        plataformas: dia.plataformas,
        snapshot: dia.snapshot,
        calculados,
      });
      dia = null;
      rascunho = {};
      desenhar();
    } catch (e) {
      mostrarErro('Não foi possível cancelar. Tente de novo.');
    }
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
      rascunho = {};
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
    else if (botao.dataset.acao === 'fechar') fechar();
    else if (botao.dataset.acao === 'descartar') descartar();
    else if (botao.dataset.acao === 'cancelar') cancelarEdicao();
    else if (botao.dataset.acao === 'novo') {
      resultado = null;
      desenhar();
    }
  });

  // Guarda o que é digitado no fechamento, para não perder se a tela for redesenhada
  caixa.addEventListener('input', (evento) => {
    const campo = evento.target.dataset.f;
    if (campo) rascunho[campo] = evento.target.value;
  });

  // Enter nos campos de texto faz a mesma coisa que o botão ao lado
  caixa.addEventListener('keydown', (evento) => {
    if (evento.key !== 'Enter') return;
    if (evento.target.id === 'valor') lancar();
    if (evento.target.id === 'odometro') abrir();
  });

  desenhar();
}