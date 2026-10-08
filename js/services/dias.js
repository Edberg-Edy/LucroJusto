// Leitura e gravação dos dias no Firestore. Nada de tela aqui.
// Cada dia fica em: users/{uid}/dias/{id}
import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  limit,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
import { db } from './firebase.js';

const colecao = (uid) => collection(db, 'users', uid, 'dias');

// Procura o dia que ainda está aberto (aberto: true). Devolve null se não houver nenhum.
export async function buscarDiaAberto(uid) {
  const resultado = await getDocs(query(colecao(uid), where('aberto', '==', true), limit(1)));
  if (resultado.empty) return null;
  const achado = resultado.docs[0];
  return { id: achado.id, ...achado.data() };
}

// Cria um dia aberto, ainda sem despesas nem ganhos.
export async function criarDia(uid, { data, odometroInicial }) {
  const dia = { aberto: true, data, odometroInicial, despesas: [], plataformas: [] };
  const ref = await addDoc(colecao(uid), { ...dia, criadoEm: serverTimestamp() });
  return { id: ref.id, ...dia };
}

// Atualiza só os campos informados, ex.: atualizarDia(uid, id, { despesas: [...] })
export const atualizarDia = (uid, id, campos) => updateDoc(doc(db, 'users', uid, 'dias', id), campos);

export const excluirDia = (uid, id) => deleteDoc(doc(db, 'users', uid, 'dias', id));