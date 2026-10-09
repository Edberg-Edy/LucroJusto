// Aba Histórico: semana com gráficos, resumo, ranking por plataforma, lista de dias (com editar e excluir) e limite do MEI.
import { listarDiasFechados, buscarDiaAberto, reabrirDia, excluirDia } from '../services/dias.js';
import { carregarConfig } from '../services/dados.js';
import { faturadoNoAno, usoDoLimite } from './mei.js';
import { resumoDaSemana, inicioDaSemana, datasDaSemana, somarDias, variacao } from './semana.js';
import { htmlGraficoLucro, htmlGraficoGastos, maiorValor } from './graficos.js';
import { htmlResultado } from './resultado.js';
import { hojeISO, dataBR, dinheiro, esc } from './formatos.js';

const linha = (rotulo, valor) => `<div class="resumo"><span>${rotulo}</span><b>${valor}</b></div>`;
const selo = { verde: 'Meta', amarelo: 'Abaixo', vermelho: 'Prejuízo' };

// "caixa" é o espaço da tela onde a aba aparece; "usuario" é quem está logado.
export async function telaHistorico(caixa, usuario) {
  caixa.innerHTML = '<p class="suave">Carregando histórico…</p>';

  let dias;
  let config;
  try {
    [dias, config] = await Promise.all([listarDiasFechados(usuario.uid), carregarConfig(usuario.uid)]);
  } catch (e) {
    caixa.innerHTML = `<section class="cartao"><h1>Histórico</h1>
      <p class="erro">Não foi possível carregar o histórico (${esc(e.code || 'erro')}). Confira a internet.</p></section>`;
    return;
  }

  const semanaAtual = inicioDaSemana(hojeISO());
  let inicio = semanaAtual; // segunda-feira da semana que está na tela
  let selecionado = null; // dia tocado no gráfico (filtra a lista)
  let verDia = null; // dia aberto em detalhe
  let aviso = ''; // mensagem curta (ex.: dia excluído)
  let confirmarExcluir = null; // id do dia que aguarda o segundo toque em ✕

  function desenhar() {
    if (verDia) {
      caixa.innerHTML = `<button type="button" class="ghost" data-acao="voltar">← Voltar</button>${htmlResultado(verDia)}`;
      return;
    }

    const datas = datasDaSemana(inicio);
    const semana = resumoDaSemana(dias, datas);
    const anterior = resumoDaSemana(dias, datasDaSemana(somarDias(inicio, -7)));
    const t = semana.totais;
    const maximo = maiorValor(semana.porDia);

    const v = variacao(t.lucro, anterior.totais.lucro);
    const textoVariacao = v === null ? '—' : `${v > 0 ? '+' : ''}${Math.round(v)}%`;

    const ano = datas[3].slice(0, 4);
    const faturado = faturadoNoAno(dias, ano);
    const mei = usoDoLimite(faturado, config.limiteMei);

    const lista = dias
      .filter((d) => datas.includes(d.data) && (!selecionado || d.data === selecionado))
      .sort((a, b) => (a.data < b.data ? 1 : -1));

    caixa.innerHTML = `
      ${aviso ? `<p class="aviso-topo" role="status">${esc(aviso)}</p>` : ''}
      <section class="cartao">
        <div class="nav-semana">
          <button type="button" class="ghost" data-semana="anterior">‹ Anterior</button>
          <b>${dataBR(datas[0]).slice(0, 5)} a ${dataBR(datas[6]).slice(0, 5)}</b>
          <button type="button" class="ghost" data-semana="proxima" ${inicio >= semanaAtual ? 'disabled' : ''}>Próxima ›</button>
        </div>
        <h2 style="margin-top:8px">Lucro</h2>
        ${htmlGraficoLucro(semana.porDia, maximo, selecionado)}
        <p class="suave legenda"><span class="verde">Verde</span>: bateu a meta · <span class="amarelo">Amarelo</span>: lucro abaixo da meta · <span class="vermelho">Vermelho</span>: prejuízo</p>
      </section>

      <section class="cartao">
        <h2>Gastos do dia</h2>
        ${htmlGraficoGastos(semana.porDia, maximo, selecionado)}
        <p class="suave legenda">Combustível, manutenção, despesas e custos fixos, na mesma escala do gráfico de lucro.</p>
      </section>

      <section class="cartao indicadores">
        <div><span>Faturamento</span><b>${dinheiro(t.faturamento)}</b></div>
        <div><span>Gastos totais</span><b>${dinheiro(t.gastos)}</b></div>
        <div><span>Lucro</span><b>${dinheiro(t.lucro)}</b></div>
        <div><span>Guardar na semana</span><b>${dinheiro(t.guardar)}</b></div>
        <div><span>Vs. semana anterior</span><b>${textoVariacao}</b></div>
        <div><span>Dias trabalhados</span><b>${t.diasTrabalhados}</b></div>
        <div><span>Média por dia</span><b>${t.mediaPorDia === null ? '—' : dinheiro(t.mediaPorDia)}</b></div>
        <div><span>Km rodados</span><b>${Math.round(t.km)}</b></div>
      </section>
      ${
        t.diasTrabalhados
          ? `<p class="suave aviso">Separe ${dinheiro(t.guardar)} desta semana (manutenção e custos fixos). Os ${dinheiro(t.lucro)} restantes são o que você pode gastar.</p>`
          : ''
      }

      ${
        semana.plataformas.length
          ? `<section class="cartao"><h2>Por plataforma</h2>${semana.plataformas
              .map((p) =>
                linha(
                  esc(p.nome) +
                    (p.corridas ? ` · ${p.corridas} corridas · ${dinheiro(p.valorComCorridas / p.corridas)}/corrida` : ''),
                  dinheiro(p.valor)
                )
              )
              .join('')}</section>`
          : ''
      }

      <section class="cartao">
        <h2>${selecionado ? 'Dia ' + dataBR(selecionado).slice(0, 5) : 'Dias da semana'}</h2>
        ${
          lista.length
            ? lista
                .map(
                  (d) => `
          <div class="item-dia">
            <button type="button" class="ver" data-ver="${d.id}">
              <b>${dataBR(d.data).slice(0, 5)}</b> · lucro ${dinheiro(d.calculados.lucro)}<br>
              <small>ganho ${dinheiro(d.calculados.faturamento)} · gasto ${dinheiro(d.calculados.gastos)}</small>
            </button>
            <span class="selo ${d.calculados.status}">${selo[d.calculados.status]}</span>
            <button type="button" class="x ed" data-editar="${d.id}" aria-label="Editar dia">✎</button>
            <button type="button" class="x ${confirmarExcluir === d.id ? 'cfm' : ''}" data-excluir="${d.id}" aria-label="Excluir dia">${confirmarExcluir === d.id ? 'Excluir?' : '✕'}</button>
          </div>`
                )
                .join('')
            : '<p class="suave">Nenhum dia fechado aqui.</p>'
        }
      </section>

      <section class="cartao">
        <h2>Limite do MEI em ${ano}</h2>
        ${linha('Faturado no ano (lançado aqui)', dinheiro(faturado))}
        ${linha('Limite anual', dinheiro(config.limiteMei))}
        <div class="medidor" role="img" aria-label="${Math.round(mei.percentual)}% do limite usado"><i style="width:${mei.percentual}%"></i></div>
        <p class="suave">${
          mei.estourou
            ? 'Você passou do limite lançado aqui. Procure um contador.'
            : `Você usou ${Math.round(mei.percentual)}% do limite. Restam ${dinheiro(mei.restante)}.`
        } Conta só o que foi lançado no app.</p>
      </section>`;
  }

  // Edição: reabre o dia e leva para a aba Hoje. Só um dia pode estar aberto por vez.
  async function editar(id) {
    try {
      if (await buscarDiaAberto(usuario.uid)) {
        aviso = 'Já existe um dia aberto. Feche ou descarte esse dia na aba Hoje antes de editar outro.';
        return desenhar();
      }
      await reabrirDia(usuario.uid, id);
      location.hash = 'hoje';
    } catch (e) {
      aviso = 'Não foi possível abrir o dia para edição. Confira a internet.';
      desenhar();
    }
  }

  // Exclusão: o primeiro toque pede confirmação, o segundo exclui.
  async function excluir(id) {
    if (confirmarExcluir !== id) {
      confirmarExcluir = id;
      desenhar();
      setTimeout(() => {
        if (confirmarExcluir === id) {
          confirmarExcluir = null;
          desenhar();
        }
      }, 4000);
      return;
    }
    try {
      await excluirDia(usuario.uid, id);
      dias = dias.filter((d) => d.id !== id);
      aviso = 'Dia excluído.';
      selecionado = null;
    } catch (e) {
      aviso = 'Não foi possível excluir. Confira a internet.';
    }
    confirmarExcluir = null;
    desenhar();
  }

  caixa.addEventListener('click', (evento) => {
    const botao = evento.target.closest('button');
    if (!botao || botao.disabled) return;
    aviso = '';

    if (botao.dataset.editar) return editar(botao.dataset.editar);
    if (botao.dataset.excluir) return excluir(botao.dataset.excluir);

    if (botao.dataset.semana === 'anterior') {
      inicio = somarDias(inicio, -7);
      selecionado = null;
    } else if (botao.dataset.semana === 'proxima') {
      inicio = somarDias(inicio, 7);
      selecionado = null;
    } else if (botao.dataset.dia) {
      selecionado = selecionado === botao.dataset.dia ? null : botao.dataset.dia;
    } else if (botao.dataset.ver) {
      verDia = dias.find((d) => d.id === botao.dataset.ver);
    } else if (botao.dataset.acao === 'voltar') {
      verDia = null;
    } else return;

    desenhar();
  });

  desenhar();
}