// Leitura e gravação dos meses no Firestore (fechamento e checklist). Nada de tela aqui.
// Cada mês fica em: users/{uid}/meses/{aaaa-mm}
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
import { db } from './firebase.js';

// Todos os meses já gravados, em um objeto: { '2026-09': {...}, '2026-10': {...} }
export async function listarMeses(uid) {
  const resultado = await getDocs(collection(db, 'users', uid, 'meses'));
  const mapa = {};
  resultado.docs.forEach((achado) => {
    mapa[achado.id] = achado.data();
  });
  return mapa;
}

// Diz se o mês está fechado (usado pela aba Hoje antes de abrir um dia).
export async function mesEstaFechado(uid, ym) {
  const foto = await getDoc(doc(db, 'users', uid, 'meses', ym));
  return foto.exists() && foto.data().fechado === true;
}

// Grava só os campos informados (merge), sem apagar o resto do mês.
export const salvarMes = (uid, ym, campos) => setDoc(doc(db, 'users', uid, 'meses', ym), campos, { merge: true });

export const fecharMes = (uid, ym, totais) => salvarMes(uid, ym, { fechado: true, fechadoEm: serverTimestamp(), totais });
export const reabrirMes = (uid, ym) => salvarMes(uid, ym, { fechado: false });