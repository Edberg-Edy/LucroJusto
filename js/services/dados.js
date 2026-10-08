// Leitura e gravação dos dados no Firestore. Nada de tela aqui.
import { doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
import { db } from './firebase.js';
import { padroes } from '../config/padroes.js';

// Os ajustes de cada usuário ficam em: users/{uid}/config/main
const refConfig = (uid) => doc(db, 'users', uid, 'config', 'main');

// Lê os ajustes. No primeiro acesso ainda não existem: cria com os valores padrão.
export async function carregarConfig(uid) {
  const foto = await getDoc(refConfig(uid));
  if (foto.exists()) return { ...padroes(), ...foto.data() };

  const nova = padroes();
  await setDoc(refConfig(uid), nova);
  return nova;
}

export const salvarConfig = (uid, config) => setDoc(refConfig(uid), config);