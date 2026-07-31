# IBVI Nova Andradina — Resumo do projeto (para revisão)

Documento de handoff — resume tudo que foi decidido e construído até agora, para outra IA/revisor avaliar. Projeto: app React Native (Expo) da igreja IBVI Nova Andradina.

## 1. Ponto de partida

O usuário tinha 15 telas prontas, geradas no Stitch (ferramenta de design da Google), mais um `DESIGN.md` com um design system nomeado "Lumina Ecclesiastic" (paleta, tipografia, espaçamento, regras de componente). Pediu uma auditoria de UI/UX e, depois, a implementação real em React Native.

## 2. Auditoria — principais achados

Relatório completo em `IBVI_Auditoria_UIUX.md` (entregue antes do código). Resumo dos pontos que mais moldaram as decisões técnicas:

- **Paleta fria demais para o brief.** O usuário pediu "tons dourados quentes, acolhedor, espiritual". Os tokens do `DESIGN.md` original eram lavanda/azul-frio (`#f9f9ff`, `#e9edff`) apesar do texto descrever "parchment warmth". Corrigido para marfim/creme quente na implementação.
- **Dois logos concorrentes** (ícone de igreja no Cadastro vs. menorá no Login) — resolvido: menorá é a marca única (o próprio `DESIGN.md` já cita a menorá como motivo central da marca).
- **Idioma misturado** — tela de Cadastro inteira em inglês, tab bar em inglês em uma tela, aba "Urgent" em outra. Corrigido: 100% PT-BR.
- **Duas telas de Perfil concorrentes** com dados diferentes — mescladas em uma só.
- **"Oração" misturava dois recursos**: Grupos Familiares (GF/células) e Mural de Pedidos de Oração, com dados divergentes entre as duas versões da "família" do usuário. Decisão do usuário: telas separadas (viraram duas abas).
- **Faixa lateral colorida em cards** (usada no componente de versículo do `DESIGN.md` original) — trocada por fundo tingido, por ser um padrão visualmente genérico/datado.
- Radius de botão/card nos prints saía mais arredondado que o token original (4px/8px) pedia — corrigido na implementação.
- Datas inconsistentes (misturava "Hoje"/"Ontem" com datas absolutas sem critério) — regra única definida.

## 3. Stack técnico (decisões e histórico de problemas)

- **Expo SDK 54** (`react@19.1.0`, `react-native@0.81.5`) — **não é a versão mais nova disponível**. Foi rebaixado de SDK 56 porque, em julho/2026, a Apple ainda não tinha aprovado a atualização do Expo Go (SDK 55/56) na App Store pública — SDK 54 é a versão que o Expo Go normal do celular do usuário consegue abrir sem TestFlight/dev build. **Isso é temporário**: quando a Apple liberar, dá pra migrar subindo a versão do `expo` no `package.json` e rodando `npx expo install --fix` (mesmo mecanismo usado pra descer).
- **NativeWind v4 + Tailwind CSS** para estilização (`className` em vez de `StyleSheet`).
- **React Navigation** (native-stack + bottom-tabs) — ver arquitetura na seção 5.
- **react-native-reanimated 4.x** requer o pacote `react-native-worklets` separado + plugin de babel próprio (`react-native-worklets/plugin`, tem que ser o último plugin da lista) — isso já está configurado, mas é um detalhe frágil se alguém mexer no `babel.config.js` sem saber disso.
- Todas as versões de pacote foram pinadas manualmente consultando o `bundledNativeModules.json` oficial do Expo pra SDK 54 (não são chutes) — ver `package.json`.

## 4. Design system implementado

- `tailwind.config.js` — paleta, tipografia (`Source Serif 4` para headlines, `Plus Jakarta Sans` para corpo/labels), radius, spacing.
- `src/constants/theme.ts` — os mesmos tokens em formato "cru" (JS puro) pra usos que não aceitam `className` (cor de ícone, sombra, etc.). **Precisa ser mantido em sincronia manual com o `tailwind.config.js`** — não há geração automática entre os dois ainda.
- Componentes-base reutilizáveis em `src/components/`: `Button`, `Card`, `Chip`, `TextField`, `SectionHeader`, `ScriptureQuote`, `MenorahMark`.

## 5. Arquitetura de navegação

```
RootNavigator
├─ AuthStack (não logado)
│   Login → SignUp → ForgotPassword → ResetPassword
└─ AppStack (logado)
    ├─ MainTabs (5 abas fixas: Home · Ensino · Grupos · Oração · Perfil)
    ├─ Devocionais (lista) → DevocionalDetail
    ├─ Eventos
    ├─ CursoDetail
    └─ GroupDetail
```

Decisão consciente: Devocionais e Eventos **não são abas fixas** — são acessados pelo grid de acesso rápido da Home. Isso evitou uma tab bar de 7 itens (as 15 telas originais sugeriam Home/Ensino/Devocional/Eventos/Oração/Grupos/Perfil, inviável numa barra de celular). Grupos e Oração viraram abas separadas por decisão explícita do usuário (a alternativa oferecida — uma aba "Comunidade" com sub-abas — foi recusada).

Autenticação hoje é **mockada** (`src/navigation/AuthContext.tsx`) — `signIn()`/`signOut()` só trocam um `useState` local, sem chamada de rede. Não há conexão com a pasta `igreja-app-backend` ainda.

## 6. Inventário de telas — o que é real vs. placeholder

| Tela | Status | Observação |
|---|---|---|
| Login | Completa | Mock de autenticação |
| Cadastro | Completa | Campo "Gênero" adicionado a pedido do usuário (chips Masculino/Feminino) |
| Esqueci senha | Completa | |
| Redefinir senha | Completa | Checklist de requisitos com validação real (comprimento, senhas iguais) |
| Home | Completa | Countdown do próximo culto é estático (não calcula data real ainda) |
| Cursos & Formação (lista + detalhe) | Completa | Dados mock em `src/data/courses.ts` |
| Devocionais (lista + artigo) | Completa | Dados mock em `src/data/devotionals.ts` |
| Eventos | Completa | Calendário calcula o mês real via `Date`, mas não navega entre meses (setas são só visuais ainda) |
| Grupos Familiares (lista + detalhe) | Completa | Convites aceitam/recusam localmente (sem persistência) |
| Pedidos de Oração | Completa | Reações Orando/Amém funcionam localmente (sem persistência) |
| Perfil | Completa | Toggle "Tema escuro" só muda o ícone — **dark mode não está implementado de verdade** |

Tudo é dado mock local (`src/data/*.ts`) — nada vem de API ainda.

## 7. Pendências conhecidas (o que checar/discutir)

1. Nenhuma integração com backend (`igreja-app-backend`) — próximo passo natural depois de validado o visual.
2. Dark mode: existe token/toggle na UI mas sem tema escuro real por trás.
3. `src/screens/PlaceholderScreen.tsx` ficou órfão (não é mais usado por nenhuma tela) — pode ser removido em uma limpeza.
4. Sem testes automatizados ainda.
5. Sem tratamento de erro/loading real (tudo assume sucesso instantâneo, por ser mock).
6. Ícones custom da marca (menorá) são geométricos simples (Views), não um SVG ilustrado — funcional, mas é um placeholder visual até ter uma arte de verdade.
7. Sem imagens reais (fotos de eventos, hero da Home etc.) — usando blocos de ícone como placeholder.

## 8. Estrutura de arquivos relevante

```
igreja-app-front/
├─ App.tsx                     # carrega fontes, monta RootNavigator
├─ tailwind.config.js
├─ babel.config.js             # inclui plugin do reanimated/worklets
├─ metro.config.js
├─ src/
│  ├─ constants/theme.ts
│  ├─ components/               # Button, Card, Chip, TextField, SectionHeader, ScriptureQuote, MenorahMark
│  ├─ data/                     # courses.ts, devotionals.ts, events.ts, groups.ts, prayerRequests.ts, profile.ts
│  ├─ navigation/                # AuthContext, AuthStack, AppStack, MainTabs, types.ts
│  └─ screens/
│     ├─ auth/                  # Login, SignUp, ForgotPassword, ResetPassword, AuthLayout
│     ├─ ensino/                # CoursesListScreen, CourseDetailScreen
│     ├─ devocionais/           # DevotionalsListScreen, DevotionalDetailScreen
│     ├─ eventos/               # EventsScreen
│     ├─ grupos/                # GroupsScreen, GroupDetailScreen
│     ├─ oracao/                # PrayerWallScreen
│     ├─ perfil/                # ProfileScreen
│     └─ HomeScreen.tsx
```
