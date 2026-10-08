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
| 2 | Login com Google | 🚧 em teste |
| 3 | Regras do Firestore e Ajustes | ⏳ |
| 4 | Cálculos com testes | ⏳ |
| 5 | Abrir o dia e despesas | ⏳ |
| 6 | Fechar o dia e resultado | ⏳ |
| 7 | Histórico semanal | ⏳ |
| 8 | Editar, excluir, limite do MEI e backup | ⏳ |
| 9 | Fechamento mensal | ⏳ |
| 10 | PWA, offline e deploy | ⏳ |

## Decisões recentes

- O app se chama **LucroJusto** (o protótipo se chamava MotoCaixa).
- Site estático sem Vite: HTML, CSS e JavaScript puros, Firebase por CDN.
- Sem Copilot no fluxo: o código vem completo, é testado e commitado por etapa.

## Próximo passo

Fechar a etapa 2 (login) e seguir para a etapa 3 (regras do Firestore e Ajustes).

## Pendências e ideias

- Visão mensal e checklist do DAS (etapa 9).
- Possível retorno do orçamento por rota no futuro.