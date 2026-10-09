// Aba Histórico. Etapa 7: visão da semana com gráficos, resumo, ranking por plataforma e lista de dias.
// (Editar, excluir e o limite do MEI chegam na Etapa 8.)
import { listarDiasFechados } from '../services/dias.js';
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
  try {
    dias = await listarDiasFechados(usuario.uid);
  } catch (e) {
    caixa.innerHTML = `<section class="cartao"><h1>Histórico</h1>
      <p class="erro">Não foi possível carregar o histórico (${esc(e.code || 'erro')}). Confira a internet.</p></section>`;
    return;
  }

  const semanaAtual = inicioDaSemana(hojeISO());
  let inicio = semanaAtual; // segunda-feira da semana que está na tela
  let selecionado = null; // dia tocado no gráfico (filtra a lista)
  let verDia = null; // dia aberto em detalhe

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

    const lista = dias
      .filter((d) => datas.includes(d.data) && (!selecionado || d.data === selecionado))
      .sort((a, b) => (a.data < b.data ? 1 : -1));

    caixa.innerHTML = `
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
          </div>`
                )
                .join('')
            : '<p class="suave">Nenhum dia fechado aqui.</p>'
        }
      </section>`;
  }

  caixa.addEventListener('click', (evento) => {
    const botao = evento.target.closest('button');
    if (!botao || botao.disabled) return;

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