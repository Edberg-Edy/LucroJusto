// HTML da visão do mês (fechamento mensal). Só monta a tela; quem grava é o historico.js.
import { dataBR, dinheiro, esc } from './formatos.js';
import { nomeDoMes } from './mes.js';
import { variacao } from './semana.js';

const linha = (rotulo, valor, destaque = '') =>
  `<div class="resumo ${destaque}"><span>${rotulo}</span><b>${valor}</b></div>`;

// ym = mês na tela; resumo/anterior = resumoDoMes deste mês e do anterior; info = documento do mês no banco (ou undefined);
// terminou = o mês já acabou?; atual = mês de hoje (para desligar "Próximo")
export function htmlMes({ ym, resumo, anterior, info, terminou, atual }) {
  const t = resumo.totais;
  const fechado = info?.fechado === true;
  const marcas = info?.checklist || {};
  const v = variacao(t.lucro, anterior.totais.lucro);
  const textoVariacao = v === null ? '—' : `${v > 0 ? '+' : ''}${Math.round(v)}%`;
  const destaque = (d) => (d ? `${dataBR(d.data).slice(0, 5)} · ${dinheiro(d.lucro)}` : '—');
  const temDias = t.diasTrabalhados > 0;

  let acao;
  if (fechado) {
    acao = `<p class="suave">Os dias deste mês estão travados: não podem ser editados nem excluídos, e não dá para abrir novos dias nele.</p>
      <button type="button" class="botao secundario" data-acao="reabrirMes">Reabrir o mês</button>`;
  } else if (!temDias) {
    acao = '<p class="suave">Nenhum dia fechado neste mês.</p>';
  } else if (!terminou) {
    acao = `<p class="suave">O mês ainda não terminou. Dá para fechar a partir do último dia dele, para não travar dias que ainda vão acontecer.</p>
      <button type="button" class="botao" disabled>Fechar o mês</button>`;
  } else {
    acao = '<button type="button" class="botao" data-acao="fecharMes">Fechar o mês</button>';
  }

  return `
    <div class="painel tres">
    <div class="col a">
    <section class="cartao">
      <div class="nav-semana">
        <button type="button" class="ghost" data-mes="anterior">‹ Anterior</button>
        <b>${nomeDoMes(ym)}</b>
        <button type="button" class="ghost" data-mes="proximo" ${ym >= atual ? 'disabled' : ''}>Próximo ›</button>
      </div>
      ${fechado ? '<p class="suave">🔒 Mês fechado</p>' : ''}
    </section>

    <section class="cartao">
      <h2>Resumo do mês</h2>
      ${linha('Faturamento', dinheiro(t.faturamento), 'total')}
      ${linha('Combustível', '− ' + dinheiro(t.combustivel))}
      ${linha('Manutenção da moto', '− ' + dinheiro(t.manutencao))}
      ${linha('Despesas', '− ' + dinheiro(t.despesas))}
      ${linha('Custos fixos (rateio)', '− ' + dinheiro(t.fixos))}
      ${linha('Lucro líquido', dinheiro(t.lucro), 'total')}
    </section>

    <section class="cartao">
      <h2>Seu dinheiro do mês</h2>
      ${linha('Guardar (manutenção e custos fixos)', dinheiro(t.guardar), 'total')}
      ${linha('Livre para gastar', dinheiro(t.lucro), 'total')}
      ${
        temDias
          ? `<p class="suave" style="margin-top:8px">Separe ${dinheiro(t.guardar)} deste mês para a moto e os custos fixos (DAS, internet etc.). Só o que sobra é seu para gastar.${t.lucro < 0 ? ' O mês não cobriu os custos.' : ''}</p>`
          : ''
      }
    </section>
    </div>

    <div class="col b">
    <section class="cartao indicadores">
      <div><span>Dias trabalhados</span><b>${t.diasTrabalhados}</b></div>
      <div><span>Média por dia</span><b>${t.mediaPorDia === null ? '—' : dinheiro(t.mediaPorDia)}</b></div>
      <div><span>Km rodados</span><b>${Math.round(t.km)}</b></div>
      <div><span>Ganho por km</span><b>${t.ganhoPorKm === null ? '—' : dinheiro(t.ganhoPorKm)}</b></div>
      <div><span>Corridas</span><b>${t.corridas || '—'}</b></div>
      <div><span>Ganho por corrida</span><b>${t.ganhoPorCorrida === null ? '—' : dinheiro(t.ganhoPorCorrida)}</b></div>
      <div><span>Vs. mês anterior</span><b>${textoVariacao}</b></div>
      <div><span>Melhor dia</span><b>${destaque(resumo.melhor)}</b></div>
      ${t.diasTrabalhados > 1 ? `<div><span>Pior dia</span><b>${destaque(resumo.pior)}</b></div>` : ''}
    </section>

    ${
      resumo.plataformas.length
        ? `<section class="cartao"><h2>Por plataforma</h2>${resumo.plataformas
            .map((p) =>
              linha(
                esc(p.nome) + (p.corridas ? ` · ${p.corridas} corridas · ${dinheiro(p.valorComCorridas / p.corridas)}/corrida` : ''),
                dinheiro(p.valor)
              )
            )
            .join('')}</section>`
        : ''
    }
    </div>

    <div class="col c">
    <section class="cartao">
      <h2>Fechamento</h2>
      <label class="marca"><input type="checkbox" data-check="dasPago" ${marcas.dasPago ? 'checked' : ''}> DAS-MEI pago</label>
      <label class="marca"><input type="checkbox" data-check="reservaTransferida" ${marcas.reservaTransferida ? 'checked' : ''}> Valor guardado transferido para a reserva</label>
      <label>Observação (opcional)
        <input type="text" data-obs value="${esc(info?.observacao || '')}">
      </label>
      <p class="suave">O DAS vence no dia 20 do mês seguinte, por isso estas marcas podem ser alteradas mesmo depois de fechar o mês.</p>
      ${acao}
    </section>
    </div>
    </div>`;
}