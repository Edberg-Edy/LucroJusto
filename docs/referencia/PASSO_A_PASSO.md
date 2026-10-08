# Passo a passo do LucroJusto

Fluxo: em cada etapa os arquivos chegam **completos**, você cola no VSCode, testa e só depois faz o commit. Uma branch por etapa (`etapa-N-nome`), uma tag por etapa fechada (`v0.N`).

## Rotina de cada etapa

```powershell
git switch main
git switch -c etapa-N-nome        # começo da etapa
# ... colar arquivos, testar com o Live Server (http://localhost:5500) ...
git add .
git commit -m "feat: ..."
git switch main
git merge etapa-N-nome
git tag v0.N
git push origin main --tags       # se o repositório estiver no GitHub
```

## Etapas

| # | Etapa | Arquivos principais | Situação |
|---|---|---|---|
| 1 | Base com abas e tema | `index.html`, `css/style.css`, `js/app.js`, `.gitignore` | ✅ v0.1 |
| 2 | Login com Google | `js/config/firebase-config.js`, `js/services/firebase.js`, `js/modules/login.js`, `js/app.js` | 🚧 |
| 3 | Regras do Firestore e Ajustes | `firestore.rules`, `js/modules/ajustes.js`, `js/config/padroes.js`, `js/services/dados.js` | ⏳ |
| 4 | Cálculos com testes | `js/modules/calculos.js`, `js/modules/calculos.test.js` | ⏳ |
| 5 | Abrir o dia e despesas | `js/modules/hoje.js`, `js/services/dias.js` | ⏳ |
| 6 | Fechar o dia e resultado | `js/modules/hoje.js`, `js/modules/resultado.js` | ⏳ |
| 7 | Histórico semanal | `js/modules/historico.js`, `js/modules/graficos.js` | ⏳ |
| 8 | Editar, excluir, limite do MEI e backup | `historico.js`, `ajustes.js` | ⏳ |
| 9 | Fechamento mensal | `js/modules/mes.js` | ⏳ |
| 10 | PWA, offline e deploy | `manifest.webmanifest`, `sw.js`, `icons/`, `firebase.json` | ⏳ |

## O que deve funcionar ao fim de cada etapa

**2. Login**
- [ ] Entra com a conta Google e vê as abas
- [ ] "Sair" (em Ajustes) volta para a tela de login
- [ ] F5 mantém o login

**3. Ajustes**
- [ ] Valores padrão aparecem no primeiro acesso
- [ ] Editar e excluir itens persiste ao recarregar
- [ ] Manutenção por km dá 0,171 com os valores padrão
- [ ] Com as regras publicadas, outro usuário não lê os seus dados

**4. Cálculos** (`node --test`). Exemplo com os valores padrão: odômetro 1000 → 1100, iFood R$ 120 e Particular R$ 50, sem despesas.
- [ ] combustível ≈ R$ 17,71 · manutenção = R$ 17,10 · fixos do dia ≈ R$ 6,09
- [ ] **lucro ≈ R$ 129,10**, farol amarelo (abaixo da meta de R$ 200)
- [ ] **guardar ≈ R$ 23,19**
- [ ] sem horas: lucro por hora "—"; sem corridas: ganho por corrida "—"

**5. Abrir o dia**
- [ ] Abre dia com data passada (futura não)
- [ ] Despesas somam e podem ser excluídas
- [ ] F5 mantém o dia aberto

**6. Fechar o dia**
- [ ] O exemplo da etapa 4 dá os mesmos números na tela
- [ ] Corridas e ganho por corrida aparecem quando informados
- [ ] O dia salvo guarda os parâmetros usados (`snapshot`) e os valores calculados

**7. Histórico semanal**
- [ ] Gráfico de lucro (farol) e gráfico de gastos (neutro), com valor em R$ acima das barras
- [ ] Tocar numa barra filtra a lista; variação contra a semana anterior confere

**8. Editar, excluir e MEI**
- [ ] Editar atualiza o resultado; excluir exige dois toques
- [ ] O limite do MEI soma só o ano atual; o backup exporta os dados

**9. Mês**
- [ ] Totais do mês batem com a soma das semanas
- [ ] Mês fechado não permite editar nem excluir; reabrir libera

**10. PWA**
- [ ] Instala na tela inicial do celular
- [ ] Em modo avião abre e lança um dia, e sincroniza quando a internet volta
- [ ] O link publicado funciona em outro aparelho com o mesmo login

## Revisar depois no Git

| Quero ver | Comando |
|---|---|
| Linha do tempo | `git log --oneline --graph --decorate` |
| O que uma etapa mudou | `git diff v0.1 v0.2 --stat` |
| Detalhe de um commit | `git show <código>` |
| Desfazer um commit | `git revert <código>` |