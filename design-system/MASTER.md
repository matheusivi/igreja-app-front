# Design System — IBVI Nova Andradina

App React Native (Expo SDK 54 + NativeWind v4) para a igreja IBVI Nova Andradina.

Gerado com a skill **ui-ux-pro-max** (`.claude/skills/ui-ux-pro-max`), com a
paleta definida pela liderança e verificação de contraste feita à mão.

> **Fonte da verdade dos tokens:** `src/constants/theme.ts`,
> `src/theme/themeVars.ts` e `global.css`. Os três precisam mudar juntos —
> não há geração automática entre eles.

---

## 1. Paleta

Paleta terrosa de oito cores, aplicada sobre a estrutura de tokens que já existia.

| Cor | Papel | Token |
|---|---|---|
| `#4A2718` | Marrom escuro — texto principal, cabeçalho | `ink`, `header` |
| `#592219` | Vinho — cor principal, ícones, botão | `primary` |
| `#7A4E47` | Tijolo — texto de apoio, contorno | `inkMuted`, `outline`, `secondary` |
| `#CDB0A1` | Rosado — fundo de selo informativo | `secondarySoft`, `goldSoft` |
| `#B98E61` | Caramelo — realce, faixa de destaque | `gold` |
| `#C7B89C` | Areia — superfície elevada, borda | `outlineVariant`, `surfaceDim` |
| `#DDDDCF` | Sálvia clara — card | `surfaceBright` |
| `#DBCEC3` | Greige — fundo da tela | `background` |

**Contraste verificado** (WCAG 2.1):

| Par | Razão | Nível |
|---|---|---|
| `#4A2718` sobre `#DDDDCF` (card) | 9,6:1 | AAA |
| `#4A2718` sobre `#DBCEC3` (fundo) | 8,6:1 | AAA |
| `#592219` sobre `#DBCEC3` | 8,2:1 | AAA |
| `#7A4E47` sobre `#DDDDCF` | 5,1:1 | AA |
| `#592219` sobre `#CDB0A1` | 6,2:1 | AA |
| `#4A2718` sobre `#C7B89C` | 6,8:1 | AA |
| `#DDDDCF` sobre `#592219` | 9,2:1 | AAA |
| `#DDDDCF` sobre `#4A2718` (header) | 9,6:1 | AAA |

**`#4A2718` sobre o caramelo `#B98E61` dá 4,46:1 — reprova por pouco.** Por isso
o botão primário no tema claro usa o vinho `#592219` com texto `#DDDDCF`, e no
escuro o caramelo carrega texto `#33190E` (5,5:1). Caramelo é cor de faixa e
ícone, **nunca fundo de texto com o marrom padrão**.

### O que ficou fora da paleta

`success` (`#006C49`) e `error` (`#BA1A1A`) continuam como estavam. A paleta é
monocromática quente e não traz um verde nem um vermelho de alerta — usar
terracota para "sucesso" e tijolo para "erro" tornaria os dois estados
indistinguíveis. Estado semântico precisa de matiz própria.

### Modo escuro

A paleta não tem superfície escura o bastante para servir de fundo *e* de card
ao mesmo tempo — `#4A2718` sozinho deixaria tudo no mesmo plano. Foram derivados
três tons de escurecimento a partir dele: `#241209` (fundo), `#33190E`
(card) e `#5C3A2C` (borda). O `#4A2718` original fica no cabeçalho.

| Token | Claro | Escuro |
|---|---|---|
| `primary` | `#592219` | `#B98E61` |
| `secondary` | `#7A4E47` | `#CDB0A1` |
| `secondarySoft` | `#CDB0A1` | `#7A4E47` |
| `goldFixed` | `#CDB0A1` | `#7A4E47` |
| `ink` | `#4A2718` | `#DDDDCF` |

---

## 2. Estilo visual

**Acessível e sóbrio**, com calor. A skill classifica como *Accessible & Ethical*:
alto contraste, texto grande, alvos generosos. É a escolha certa aqui pelo
público — a congregação inclui idosos, e o app precisa funcionar na luz do sol
no pátio da igreja.

O que **não** usar, e por quê:

- **Glassmorphism e neumorphism** — dependem de contraste sutil, que é o oposto
  do que este público precisa.
- **Sombras empilhadas** — o sistema tem uma sombra só (`ambientGlow`), usada
  apenas em cards de nível 1. Duas sombras na mesma tela achatam a hierarquia.
- **Emoji como ícone** — sempre Ionicons ou MaterialCommunityIcons.
- **Gradientes** — a paleta já carrega o calor necessário.

---

## 3. Tipografia

Duas famílias, cinco pesos. Já instaladas via `@expo-google-fonts`.

**Source Serif 4** — títulos, números, citações bíblicas. O serifado dá o tom
de permanência que combina com a igreja sem parecer antiquado.

**Plus Jakarta Sans** — corpo, rótulos, botões. Alta legibilidade em telas
pequenas.

| Uso | Classe | Tamanho | Entrelinha |
|---|---|---|---|
| Título de tela | `font-serif-bold text-2xl` | 24 | 32 |
| Título de seção | `font-serif-bold text-lg` | 18 | 24 |
| Título de card | `font-serif-bold text-base` | 16 | 22 |
| Corpo | `font-sans text-base` | 16 | 28 (1,75) |
| Corpo secundário | `font-sans text-sm` | 14 | 20 |
| Rótulo | `font-sans-medium text-xs` | 12 | 16 |
| Selo | `font-sans-semibold text-[11px]` | 11 | — |

**Mínimo de 16px para texto de leitura.** É a regra `readable-font-size` da
skill, e é o que o devocional usa (`text-base leading-7`). Só desça de 16px em
rótulo, selo e metadado — nunca em texto que a pessoa vai ler por parágrafos.

---

## 4. Espaçamento

Escala em `src/constants/theme.ts`:

```
xs 4 · base 8 · sm 12 · md 24 · lg 48 · xl 80 · gutter 20
```

**Margem lateral é sempre `px-gutter` (20px).** Nenhuma tela inventa a sua.

Ritmo vertical: `gap-md` (24) entre seções, `gap-3` (12) entre cards de uma
lista, `gap-1`/`gap-2` dentro de um card.

Raio: `card: 8` para cartões, `xl: 12` para imagens e caixas de mídia,
`full` para selos e avatares.

---

## 5. Hierarquia mobile

A ordem da Home reflete a pergunta que a pessoa traz ao abrir o app:

1. **Quando é o próximo culto** → card de destaque com contagem regressiva
2. **O que eu quero fazer agora** → acesso rápido, quatro atalhos
3. **Quem faz aniversário** → laço da comunidade
4. **O que preciso saber** → avisos

Regras que valem em todas as telas:

- **Um elemento dominante por tela.** Na Home é o próximo evento. Se dois
  elementos disputam, nenhum vence.
- **Card com `accent`** (a faixa dourada no topo) é reservado ao item em
  destaque. Usar em tudo tira o significado.
- **Estado vazio nunca some.** A seção continua na tela com uma explicação —
  seção que desaparece parece defeito.

---

## 6. Toque e acessibilidade

Prioridade 1 e 2 da skill. Regras aplicadas:

- **Alvo mínimo de 44×44.** Ícone pequeno recebe `hitSlop={8}` — presente em
  todos os ícones de cabeçalho e ação do app.
- **`accessibilityRole` e `accessibilityLabel`** em todo elemento tocável que
  não tem texto visível. Um `<Ionicons name="trash-outline" />` sozinho é
  invisível para o leitor de tela.
- **Feedback de toque** em card clicável: `style={({pressed}) => pressed && {opacity: 0.7}}`.
  Sem isso o card parece morto enquanto a próxima tela carrega.
- **Cor nunca é o único indicador.** Turma lotada tem o selo "Lotada" além da
  cor; aviso vencido tem o selo "Vencido".
- **Agrupar leitura de número + unidade.** A contagem regressiva usa
  `accessible` com `accessibilityLabel="3 dias"`, senão o leitor anuncia
  "3" e "dias" separados.

---

## 7. UX para app de igreja

O que este produto tem de específico:

**Nunca prometa o que o sistema não entrega.** Um card dizendo "Certificado
incluso" sem certificado nenhum é pior que a ausência dele. Foi removido.

**Ação destrutiva sempre explica a consequência em número.** "Esta turma tem 12
matriculados. Excluir apaga o registro de quem participou." Números tornam a
decisão concreta.

**Prefira encerrar a excluir.** Turma, curso e grupo guardam a história de
quem participou. O diálogo de exclusão aponta o caminho preservador quando ele
existe.

**Restrição precisa dizer o motivo.** "Este curso é exclusivo para mulheres"
em vez de uma lista vazia. Lista vazia faz a pessoa voltar todo mês esperando
algo que nunca vai aparecer.

**Contribuição não é transação.** A tela de dízimo mostra a chave PIX e diz
claramente que nada passa pelo app. Um app de igreja pedindo dado bancário
gera desconfiança justificada.

**O conteúdo é da igreja.** Sem botão de compartilhar em aviso — a pessoa abre
o app para se informar.

---

## 8. Checklist antes de entregar tela

- [ ] Texto de leitura em 16px ou mais
- [ ] Ícone tocável com `hitSlop` e `accessibilityLabel`
- [ ] Card clicável com feedback de toque
- [ ] Estado vazio com explicação, não em branco
- [ ] Estado de erro com caminho de saída ("Tentar novamente")
- [ ] Contraste conferido nos dois temas
- [ ] Cor não é o único indicador de estado
- [ ] Margem lateral `px-gutter`, sem valor solto
- [ ] Uma sombra por tela, só em card de nível 1
- [ ] Nenhum botão sem `onPress` de verdade
