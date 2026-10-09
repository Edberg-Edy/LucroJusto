# LucroJusto: status do projeto

Atualizado a cada etapa fechada. Contexto completo em [README.md](README.md) e [docs/SPEC.md](docs/SPEC.md).

## Fluxo de trabalho

1. Os arquivos de cada etapa chegam **completos** (nunca parciais).
2. Cole no VSCode, rode com o Live Server e confira a lista de testes da etapa.
3. Após aprovação, faça o commit, o merge na `main` e a tag.
4. Só então começa a etapa seguinte.

## Etapas

| Etapa | Descrição | Situação |
|---|---|---|
| 1 | Base com abas e tema | ✅ v0.1 |
| 2 | Login com Google | ✅ v0.2 |
| 3 | Regras do Firestore e Ajustes | ✅ v0.3 |
| 4 | Cálculos com testes | ✅ v0.4 |
| 5 | Abrir o dia e despesas | ✅ v0.5 |
| 6 | Fechar o dia e resultado | ✅ v0.6 |
| 7 | Histórico semanal | ✅ v0.7 |
| 8 | Editar, excluir, limite do MEI e backup | 🚧 em teste |
| 9 | Fechamento mensal | ⏳ |
| 10 | PWA, offline e deploy | ⏳ |

## Decisões recentes

- O app se chama **LucroJusto** (o protótipo se chamava MotoCaixa).
- Site estático sem Vite: HTML, CSS e JavaScript puros, Firebase por CDN.
- Sem Copilot no fluxo: o código vem completo, é testado e commitado por etapa.
- Firestore na região São Paulo (`southamerica-east1`). As regras foram publicadas à mão no console; `firestore.rules` guarda a cópia.
- Ganho por corrida considera só as plataformas que informaram o número de corridas.
- Editar um dia reabre o dia e mantém a fotografia de parâmetros dele (mudar o litro depois não altera o passado).
- Testes dos cálculos com `npm test` (executor nativo do Node, sem bibliotecas).

## Próximo passo

Fechar a etapa 8 (editar, excluir, limite do MEI e backup) e seguir para a etapa 9 (fechamento mensal).

## Pendências e ideias

- Visão mensal e checklist do DAS (etapa 9).
- Possível retorno do orçamento por rota no futuro.