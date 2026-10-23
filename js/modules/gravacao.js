// Gravação que não trava quando falta sinal.
// O Firestore guarda a alteração no aparelho na hora e só confirma "gravado" quando o servidor responde.
// Sem sinal essa confirmação demora, e o app parecia travado. Aqui esperamos só um pouco: se o servidor
// não responder a tempo, seguimos em frente (a alteração já está no aparelho e sincroniza quando o sinal voltar).
// Função pura (não usa Firebase), por isso dá para testar sozinha (veja gravacao.test.js).

export const ESPERA_PADRAO = 2500; // milissegundos

// Devolve { sincronizado: true } se o servidor confirmou a tempo, ou { sincronizado: false } se ainda está pendente.
// Se o servidor recusar a gravação a tempo, o erro é repassado (quem chama mostra a mensagem).
export function gravar(promessa, esperaMs = ESPERA_PADRAO) {
  return new Promise((resolve, reject) => {
    let terminou = false;
    const fim = (acao) => {
      if (terminou) return false;
      terminou = true;
      clearTimeout(timer);
      acao();
      return true;
    };
    const timer = setTimeout(() => fim(() => resolve({ sincronizado: false })), esperaMs);

    promessa.then(
      () => fim(() => resolve({ sincronizado: true })),
      (erro) => {
        // Recusa que chegou depois do prazo: o app já seguiu em frente, então só registramos no console.
        if (!fim(() => reject(erro))) console.warn('Gravação recusada pelo servidor depois do prazo:', erro);
      }
    );
  });
}
