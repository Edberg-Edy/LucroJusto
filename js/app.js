// LucroJusto: ponto de entrada. Etapa 2: login com Google + navegação entre as 3 abas.
import { observarLogin, sair } from './services/firebase.js';
import { telaLogin } from './modules/login.js';

// Abas do app. O conteúdo real de cada uma será criado nas próximas etapas.
const abas = [
  { id: 'hoje', nome: 'Hoje', icone: '🏍️', texto: 'Aqui você vai abrir e fechar o dia.' },
  { id: 'historico', nome: 'Histórico', icone: '📊', texto: 'Aqui ficarão os gráficos de lucro e de gastos.' },
  { id: 'ajustes', nome: 'Ajustes', icone: '⚙️', texto: 'Aqui ficarão a meta, o km por litro e os custos.' },
];

const tela = document.getElementById('tela');
const menu = document.getElementById('abas');

let usuario = null; // null = ninguém logado
let carregando = true; // true até o Firebase responder se já existe alguém logado

// A aba atual fica na URL (#hoje, #historico, #ajustes), então recarregar a página não perde o lugar.
function abaAtual() {
  const id = location.hash.replace('#', '');
  return abas.find((a) => a.id === id) || abas[0];
}

function desenhar() {
  // 1) Esperando o Firebase responder
  if (carregando) {
    menu.hidden = true;
    tela.innerHTML = '<p class="suave">Carregando…</p>';
    return;
  }

  // 2) Ninguém logado: só a tela de login, sem abas
  if (!usuario) {
    menu.hidden = true;
    menu.innerHTML = '';
    telaLogin(tela);
    return;
  }

  // 3) Logado: abas normais
  const atual = abaAtual();

  tela.innerHTML = `
    <section class="cartao">
      <h1>${atual.nome}</h1>
      <p class="suave">${atual.texto}</p>
    </section>
    ${
      atual.id === 'ajustes'
        ? `<section class="cartao">
             <h2>Conta</h2>
             <p class="suave" id="email"></p>
             <button type="button" class="botao secundario" id="sair">Sair</button>
           </section>`
        : ''
    }`;

  if (atual.id === 'ajustes') {
    document.getElementById('email').textContent = usuario.email; // textContent evita problemas com caracteres especiais
    document.getElementById('sair').addEventListener('click', () => sair());
  }

  menu.hidden = false;
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

// O Firebase avisa quando o app abre (já logado ou não) e a cada entrada ou saída.
observarLogin((u) => {
  usuario = u;
  carregando = false;
  desenhar();
});

desenhar();