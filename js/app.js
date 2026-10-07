// LucroJusto: ponto de entrada. Etapa 1: apenas a navegação entre as 3 abas.

// Abas do app. O conteúdo real de cada uma será criado nas próximas etapas.
const abas = [
  { id: 'hoje', nome: 'Hoje', icone: '🏍️', texto: 'Aqui você vai abrir e fechar o dia.' },
  { id: 'historico', nome: 'Histórico', icone: '📊', texto: 'Aqui ficarão os gráficos de lucro e de gastos.' },
  { id: 'ajustes', nome: 'Ajustes', icone: '⚙️', texto: 'Aqui ficarão a meta, o km por litro e os custos.' },
];

const tela = document.getElementById('tela');
const menu = document.getElementById('abas');

// A aba atual fica na URL (#hoje, #historico, #ajustes), então recarregar a página não perde o lugar.
function abaAtual() {
  const id = location.hash.replace('#', '');
  return abas.find((a) => a.id === id) || abas[0];
}

function desenhar() {
  const atual = abaAtual();

  tela.innerHTML = `
    <section class="cartao">
      <h1>${atual.nome}</h1>
      <p class="suave">${atual.texto}</p>
    </section>`;

  menu.innerHTML = abas
    .map(
      (a) => `
      <button type="button" data-aba="${a.id}" ${a.id === atual.id ? 'aria-current="page"' : ''}>
        <span class="icone" aria-hidden="true">${a.icone}</span>
        <span>${a.nome}</span>
      </button>`
    )
    .join('');
}

menu.addEventListener('click', (evento) => {
  const botao = evento.target.closest('button[data-aba]');
  if (botao) location.hash = botao.dataset.aba;
});

window.addEventListener('hashchange', desenhar);
desenhar();