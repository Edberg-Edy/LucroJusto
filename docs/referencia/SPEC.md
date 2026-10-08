# LucroJusto: especificação para o Copilot

App para motoboy controlar ganhos, gastos e lucro do dia. Prioridade: simplicidade (lançar o dia em menos de 1 minuto). Usado no celular, na rua, às vezes sem sinal.

Referência visual e de comportamento: `docs/referencia/motocaixa.html` (protótipo funcional, dados só no aparelho). Reproduzir o comportamento dele, trocando o armazenamento por Firebase.

## Como usar este arquivo

Coloque em `docs/SPEC.md` e o protótipo em `docs/referencia/motocaixa.html`. Siga `docs/PASSO_A_PASSO.md`, uma etapa por vez, testando e fazendo commit antes da próxima.

## Stack

- HTML, CSS e JavaScript puros com módulos ES. Sem Vite, sem npm e sem etapa de build.
- Firebase pelo CDN (`gstatic.com/firebasejs/12.19.0`): Authentication (login com Google) e Firestore com persistência offline.
- PWA (manifest + service worker) para instalar na tela inicial.
- Testes dos cálculos com o executor nativo do Node (`node --test`).
- Deploy: Firebase Hosting (gratuito) ou GitHub Pages.
- A configuração do Firebase no código não é segredo. Quem protege os dados são as regras do Firestore (abaixo).

## Modelo de dados (Firestore)

Tudo dentro de `users/{uid}`, para cada usuário ver só o que é seu.

- `config/main`: `{ meta, kmPorLitro, precoLitro, diasPorMes, limiteMei, plataformas: [nome], manutencao: [{item, preco, duracaoKm}], fixos: [{item, valorMensal}] }`
- `dias/{id}`: `{ aberto (true enquanto o dia não foi fechado), data: "YYYY-MM-DD", odometroInicial, odometroFinal, horas (opcional), plataformas: [{nome, valor, corridas (opcional)}], despesas: [{categoria, valor}], snapshot: {meta, kmPorLitro, precoLitro, manutencaoPorKm, fixoPorDia}, calculados: {km, faturamento, combustivel, manutencao, despesas, fixos, lucro, status} }`
- `meses/{YYYY-MM}`: `{ fechado, fechadoEm, totais, checklist: {dasPago, reservaTransferida}, observacao }`

O `snapshot` guarda os valores de configuração usados naquele dia. Assim, mudar o preço do litro depois não altera dias antigos.

Valores padrão: meta 200, 35 km/l, litro R$ 6,20, 24 dias/mês, limite MEI R$ 81.000, plataformas iFood, Rappi, 99, Loggi, Particular (editáveis e excluíveis), fixos "Internet e celular" R$ 60 e "DAS-MEI" R$ 86,05, e manutenção: óleo e filtro 50/1000, pneu traseiro 250/10000, pneu dianteiro 200/15000, kit relação 250/20000, freios 100/10000, revisões e imprevistos 600/10000 (preço / km de duração).

## Regras de cálculo

- manutencaoPorKm = soma(preco / duracaoKm), arredondada para 3 casas decimais (como no protótipo)
- km = odometroFinal − odometroInicial (final deve ser maior que o inicial)
- faturamento = soma dos valores das plataformas
- combustivel = km / kmPorLitro × precoLitro
- manutencao = km × manutencaoPorKm
- fixos do dia = soma(valorMensal) / diasPorMes
- lucro = faturamento − combustivel − manutencao − despesas − fixos
- gastos totais = combustivel + manutencao + despesas + fixos
- **guardar** = manutencao + fixos (dinheiro que não se gasta hoje)
- livre para gastar = lucro
- ganho por km = faturamento / km; lucro por hora = lucro / horas (se não houver horas, mostrar "—"); ganho por corrida = soma dos ganhos das plataformas que informaram corridas ÷ corridas informadas (se não houver, "—")
- status (farol: `verde`, `amarelo`, `vermelho`): verde se lucro ≥ meta; amarelo se lucro > 0; vermelho se lucro ≤ 0

## Telas (3 abas: Hoje, Histórico, Ajustes)

**Hoje**
- Abrir o dia: data (padrão hoje, não aceita futuro; permite dia esquecido) e odômetro inicial.
- Dia aberto: lançar despesas por botões (Comida, Manutenção, Estacionamento, Multa, Outros) e valor.
- Fechar: odômetro final, horas (opcional, aceita 8 ou 8:30) e uma linha por plataforma com nome, ganho e corridas (opcional).
- Resultado: cartão colorido com o lucro, indicadores (ganho/km, lucro/hora, km, horas, corridas, ganho/corrida), quadro "Seu dinheiro do dia" (entrou, gastou, guardar, livre) e detalhamento.

**Histórico** (alternar Semana / Mês)
- Semana (segunda a domingo), com navegação anterior/próxima:
  - Gráfico 1 "Lucro": uma barra por dia nas cores do farol, valor em R$ acima de cada barra.
  - Gráfico 2 "Gastos do dia": barras em cinza neutro, valor em R$ acima, mesma escala.
  - Resumo: faturamento, gastos, lucro, guardar, variação vs. semana anterior, dias trabalhados, média por dia, km.
  - Ranking por plataforma (total, corridas, valor por corrida).
  - Lista de dias com ver, editar e excluir (excluir pede segundo toque, sem `alert`/`confirm`).
- Mês: ver "Fechamento mensal".
- Limite do MEI: faturado no ano contra o limite, com barra de progresso.

**Ajustes**: meta, km/l, preço do litro, dias por mês, limite MEI, lista de manutenção (mostra manutenção/km, combustível/km e custo total/km), custos fixos mensais (mostra custo por dia), plataformas, exportar backup em JSON.

## Fechamento mensal

- Visão automática do mês escolhido: faturamento, gastos (separados em combustível, manutenção, despesas e fixos), lucro, **valor a guardar**, dias trabalhados, média por dia, km, corridas, ganho por km, ganho por corrida, melhor e pior dia, comparação com o mês anterior, ranking por plataforma.
- Botão "Fechar o mês" com checklist: DAS pago (vence dia 20) e valor guardado transferido. Ao fechar, grava os totais em `meses/{YYYY-MM}` e o mês passa a ser somente leitura (com opção de reabrir).

## Regras do Firestore

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

## Etapas

Veja `docs/PASSO_A_PASSO.md` (10 etapas). Fluxo atual: os arquivos de cada etapa são enviados completos, testados e só então commitados.