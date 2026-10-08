// Configuração do app Web do Firebase (projeto LucroJusto).
// Estes valores NÃO são segredo (todo site com Firebase os expõe). Quem protege os dados são as regras do Firestore.
export const firebaseConfig = {
  apiKey: 'AIzaSyAevYHm9cCcY1sJ2RPWSoeRreEQAuJwTd8',
  authDomain: 'lucrojusto-2fc5f.firebaseapp.com',
  projectId: 'lucrojusto-2fc5f',
  storageBucket: 'lucrojusto-2fc5f.firebasestorage.app',
  messagingSenderId: '378800973383',
  appId: '1:378800973383:web:d239471c1e36f73a27b362',
};

// Vira false enquanto algum valor ainda for 'COLE_AQUI' (a tela de login avisa).
export const configurado = Object.values(firebaseConfig).every((v) => v && v !== 'COLE_AQUI');