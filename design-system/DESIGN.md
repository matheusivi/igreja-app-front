# Sistema de design — IBVI Nova Andradina

Personalidade: **acolhedor + moderno**. Público: famílias, com presença de idosos.
Referência de registro: Glorify (entrada leve, imagem grande, pouca moldura).

Este documento manda. Se o código discordar dele, o código está errado.

> **Fonte da verdade dos tokens:** `src/constants/theme.ts`, `src/theme/themeVars.ts`,
> `global.css` e `tailwind.config.js`. Os quatro mudam juntos — não há geração
> automática entre eles.

---

## 0. O diagnóstico que originou esta versão

A versão anterior era tecnicamente correta e visualmente genérica. As causas,
nomeadas para não voltarem:

1. **Fundo de meio-tom.** `#DBCEC3` como página deixava tudo pesado, e como o
   card (`#DDDDCF`) era quase da mesma luminosidade, a separação precisava vir
   de borda **e** sombra. Daí o "card genérico" — borda + sombra + fundo, o
   padrão que mais denuncia interface montada por template.
2. **Faixa marrom escura em todo topo.** Repetida em sete telas, ela era a
   primeira coisa que se via em qualquer lugar do app. Repetição de peso vira
   monotonia, e monotonia escura vira solenidade.
3. **Raio único.** Tudo com o mesmo canto. Nada parecia conter nada.
4. **Espaçamento único.** `gap-md` entre tudo. Sem ritmo, o olho não agrupa.
5. **Sombra de cor errada.** A sombra do sistema era azul (`#1E40AF`) numa
   paleta inteiramente quente.
6. **Sem hierarquia de botão.** Havia dois estilos. Uma tela com quatro ações
   precisa de quatro pesos, senão todas gritam junto.

---

## 1. Paleta

O DNA marrom/dourado continua. O que mudou foi a **luminosidade da base**: a
página subiu para um papel quente quase branco. Isso é o que permite o card
existir sem borda e sem sombra — ele se separa por ser mais claro que a
página, e só.

### Tema claro

| Token | Hex | Papel |
|---|---|---|
| `background` | `#FAF6F0` | Papel quente. A página. |
| `surface-bright` | `#FFFCF7` | Card. Mais claro que a página — é isso que o separa. |
| `surface-dim` | `#F2EBE1` | Seção afundada, chip inativo, campo. |
| `outline-variant` | `#E6D9C9` | Divisória decorativa. |
| `outline` | `#9C8A70` | Contorno de campo de formulário. |
| `ink` | `#3D2317` | Texto principal. |
| `ink-muted` | `#7A5C4A` | Texto de apoio. |
| `primary` | `#A85A2C` | **Ação.** Terracota. |
| `gold` | `#B98E61` | **Realce gráfico.** Nunca texto. |
| `gold-soft` | `#CDB0A1` | Superfície de realce. |
| `secondary` | `#8A4522` | Link e ação secundária. |
| `success` | `#4A6B3A` | Musgo. |
| `error` | `#8C3A1C` | Tijolo queimado. |
| `inverse-surface` | `#3D2317` | Superfície imersiva (hero com foto). |

### Contraste verificado (WCAG 2.1)

| Par | Razão | Nível |
|---|---|---|
| `ink` sobre papel | 13,4:1 | AAA |
| `ink` sobre card | 14,1:1 | AAA |
| `ink-muted` sobre papel | 5,6:1 | AA |
| `primary` sobre papel | 4,7:1 | AA |
| Texto do botão sobre `primary` | 4,9:1 | AA |
| `ink` sobre `gold` | 4,9:1 | AA |
| `success` sobre papel | 5,6:1 | AA |
| `error` sobre papel | 7,1:1 | AAA |
| `outline` sobre papel (borda de campo) | 3,1:1 | AA não-texto |

### As três regras de cor que não se quebram

**O dourado `#B98E61` dá 2,75:1 sobre o papel.** Ele é fundo, faixa, moldura e
ícone grande — **nunca texto, nunca ícone pequeno**. Toda vez que o dourado
apareceu como texto neste projeto, foi erro.

**`primary` sobre `primary-soft` dá 4,24:1 e reprova.** Fundo tingido claro
pede texto `ink`, não a cor da marca.

**Só dois níveis de texto.** Uma paleta quente e clara não sustenta um terceiro
tom legível — todos os candidatos ficaram entre 3 e 4,3:1. Melhor dois níveis
que todo mundo lê do que três com um ilegível.

### Verde e vermelho numa paleta quente

`success` virou musgo `#4A6B3A` e `error` virou tijolo queimado `#8C3A1C`.
Ambos permanecem distinguíveis entre si e do resto, mas saíram do verde-menta e
do vermelho-alarme genéricos, que eram as duas únicas cores frias da tela e
gritavam "cor padrão de framework".

### Tema escuro

Não é a paleta clara invertida: é uma paleta própria, também quente.

| Token | Claro | Escuro |
|---|---|---|
| `background` | `#FAF6F0` | `#241710` |
| `surface-bright` | `#FFFCF7` | `#33231A` |
| `ink` | `#3D2317` | `#F2E7DC` |
| `ink-muted` | `#7A5C4A` | `#C9B4A4` |
| `primary` | `#A85A2C` | `#E0A470` |
| `success` | `#4A6B3A` | `#9CC17E` |
| `error` | `#8C3A1C` | `#F0A48A` |

---

## 2. Tipografia

Duas famílias, pareadas em **eixo de contraste** (serifada + sem serifa), que é
o único pareamento que funciona sem virar ruído.

**Source Serif 4** — títulos, números grandes, citação bíblica.
**Plus Jakarta Sans** — corpo, rótulo, botão, metadado.

### Escala

| Papel | Classe | Tam. | Entrelinha | Peso |
|---|---|---|---|---|
| Display (hero) | `font-serif-bold text-[32px]` | 32 | 38 | 700 |
| Título de tela | `font-serif-bold text-[26px]` | 26 | 32 | 700 |
| Título de seção | `font-serif-bold text-lg` | 18 | 24 | 700 |
| Título de card | `font-serif-bold text-base` | 16 | 22 | 700 |
| Corpo | `font-sans text-base` | 16 | 26 | 400 |
| Corpo de apoio | `font-sans text-sm` | 14 | 20 | 400 |
| Rótulo | `font-sans-medium text-[13px]` | 13 | 18 | 500 |
| Sobretítulo | `font-sans-semibold text-[11px]` + `tracking-widest` | 11 | 14 | 600 |

**Piso de 16px para texto de leitura.** Só desça disso em rótulo, sobretítulo e
metadado — nunca em algo que a pessoa lê por parágrafos. A congregação tem
idosos; esta regra não é negociável.

**Piso absoluto de 11px.** Abaixo disso não existe no sistema.

---

## 3. Espaçamento

```
xs 4 · sm 8 · md 12 · lg 16 · xl 24 · 2xl 32 · 3xl 48 · gutter 20
```

**O ritmo é o ponto, não a escala.** A regra:

| Distância | Significado |
|---|---|
| 4–8 | Partes da mesma coisa (ícone e rótulo, número e unidade) |
| 12–16 | Itens irmãos de uma lista |
| 24 | Blocos distintos dentro de uma seção |
| 32–48 | Entre seções |

Se tudo na tela está a 24, o olho não consegue agrupar nada. Espaçamento
uniforme é a assinatura visual de interface montada por template.

**Margem lateral é sempre `px-gutter` (20).** Nenhuma tela inventa a sua.

**Padding vertical não é simétrico.** O de baixo leva 2 a 4px a mais que o de
cima. Óptica: o olho lê o bloco como descentralizado quando são iguais.

---

## 4. Raio

Raio único em tudo é o item nº 3 do diagnóstico. A escala é **aninhada**: o
que está dentro tem canto mais fechado que o que o contém.

| Token | Valor | Uso |
|---|---|---|
| `sm` | 6 | Elementos dentro de um card (imagem, campo, mini-selo) |
| `md` | 10 | Botão, chip |
| `lg` | 16 | Card |
| `xl` | 24 | Superfície imersiva, folha, hero |
| `full` | 9999 | Avatar de pessoa, e só |

**Avatar de pessoa é círculo. Foto de coisa é `sm`.** Foto de evento, de
família e de curso em círculo é o que faz todo app parecer o mesmo app.

---

## 5. Elevação

**Três níveis, e o padrão é o zero.**

| Nível | Como | Quando |
|---|---|---|
| 0 | Só a cor da superfície | **Padrão.** Card comum. |
| 1 | Sombra quente sutil | Um card em destaque por tela. No máximo um. |
| 2 | Sombra quente maior | Só o que flutua: folha, diálogo. |

A sombra é **tingida de marrom** (`#3D2317`), nunca preta e nunca azul. Sombra
preta sobre paleta quente cria uma borda cinza que suja a cor.

**A regra que resolve o "card genérico":** um card se separa da página **pela
luminosidade da superfície**. Borda e sombra são exceção, não composição
padrão. Se você precisou dos três ao mesmo tempo, o contraste de superfície
está errado.

---

## 6. Botões

Quatro níveis. Uma tela usa **no máximo um `primary`**.

| Variante | Fundo | Texto | Quando |
|---|---|---|---|
| `primary` | `primary` sólido | `on-primary` | A ação da tela. Uma por tela. |
| `secondary` | `surface-dim` | `ink` | Ação de apoio que ainda é botão. |
| `outline` | transparente + 1px `outline` | `ink` | Terceira opção, ou par de ações equivalentes. |
| `ghost` | transparente | `secondary` | Ação terciária. Parece link, é botão. |
| `destructive` | transparente + 1px `error` | `error` | Excluir, sair. **Nunca preenchido.** |

**Destrutivo preenchido é armadilha.** Um botão vermelho grande atrai o toque
justamente na ação que não tem volta. Ele fica visível e nomeado, mas nunca é
o elemento mais pesado da tela.

**Altura mínima 48.** A regra pede 44; 48 dá folga para dedo de idoso.

**Estado pressionado:** `scale(0.98)` + opacidade 0,9. Sem isso o botão parece
morto enquanto a próxima tela carrega.

---

## 7. Cards

Quatro variantes. A escolha diz o que a coisa é.

| Variante | Composição | Quando |
|---|---|---|
| `plain` | `surface-bright`, raio `lg`, sem borda, sem sombra | **Padrão.** |
| `raised` | `plain` + sombra nível 1 | Um por tela. O destaque. |
| `tinted` | `surface-dim`, sem borda | Informação de apoio, estado vazio |
| `feature` | `inverse-surface` ou foto + véu, raio `xl` | Momento imersivo. Um por tela. |

**Card dentro de card é sempre errado.** Se um card precisa agrupar filhos, os
filhos são linhas separadas por divisória — não caixas dentro de caixa.

---

## 8. Barra de abas

Direção: **clara, com o ativo marcado por forma, não só por cor.**

- Fundo `surface-bright`, divisória `outline-variant` de 1px em cima.
- Item ativo: ícone preenchido dentro de uma pílula `gold-soft`, rótulo em
  `ink` peso 600.
- Item inativo: ícone de contorno em `ink-muted`, rótulo peso 400.

A barra marrom escura anterior era a segunda faixa pesada da tela — com o
cabeçalho escuro em cima, o conteúdo ficava espremido entre dois blocos
escuros. Uma só das duas pode ser pesada, e nenhuma precisa ser.

**Marcar o ativo por forma além da cor** é a regra de "cor não é o único
indicador". Quem não distingue marrom de dourado ainda vê a pílula.

---

## 9. Cabeçalhos

A faixa escura em todo topo saiu. Dois padrões:

**`ScreenHeader`** — telas de lista e abas. Fundo é a própria página. Título
grande serifado em `ink`, sobretítulo em `secondary`, ação como botão
`primary`. Sem faixa, sem moldura.

**`TopBar`** — telas de detalhe e formulário. 56px, fundo da página, título
centralizado, ícones em `primary`.

**A cor escura fica reservada para o hero da Home**, que é o único lugar do app
que tem foto atrás. Escuro que aparece uma vez é atmosfera; escuro que aparece
sete vezes é peso.

---

## 10. Fotografia

**Uma foto por contexto.** A foto do prédio aparecia no hero, no card do
próximo evento e no card do aviso — três vezes na mesma rolagem da Home. A
mesma imagem repetida em uma tela mata o efeito das três.

Regra: a foto do prédio é do **hero**. Card de evento e de aviso mostram a
imagem própria daquele registro; quando não tem, mostram um bloco tipográfico
tingido, não a foto genérica da igreja.

---

## 11. Voz

O app já tem voz própria — "Academia de Fé", "Família IBVI", "A expectativa
gera o ambiente de milagres". Ela precisa de **peso tipográfico**, senão é
invisível.

- Sem ponto de exclamação em texto de sistema. Confiante, não animado.
- Frase curta. Verbo primeiro no botão: "Criar turma", não "Criação de turma".
- Sem "Ops", sem "com sucesso". O aviso de sucesso já é o sucesso.
- Estado vazio é convite com saída, nunca um "nada aqui" seco.

---

## 12. Checklist antes de entregar tela

- [ ] Uma ação `primary`, no máximo
- [ ] Um card `raised`, no máximo
- [ ] Nenhum card dentro de card
- [ ] Espaçamento variado — se está tudo a 24, refaça
- [ ] Raio aninhado: o de dentro é menor que o de fora
- [ ] Dourado não é texto nem ícone pequeno
- [ ] Texto de leitura em 16px ou mais
- [ ] Alvo tocável de 48
- [ ] Feedback de toque em tudo que é tocável
- [ ] Estado vazio com saída
- [ ] Cor não é o único indicador de estado
- [ ] Contraste conferido nos dois temas
