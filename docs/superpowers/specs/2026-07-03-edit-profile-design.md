# Editar Perfil — Design

## Contexto

O app já tem integração real com a API do backend IBVI (auth, conteúdos, cursos/salas,
eventos, grupos familiares, pedidos de oração). Um dos gaps identificados na revisão do
estado atual: o item "Configurações da conta" na `ProfileScreen` é um botão sem ação —
não existe tela nem chamada para `PATCH /api/auth/me`. Este documento cobre a implementação
dessa tela de edição de perfil.

## Escopo

Campos editáveis (tudo que `PATCH /api/auth/me` aceita, exceto foto/email/senha):

- `nomeCompleto` — texto
- `sexo` — `Masculino | Feminino`
- `dataNascimento` — data (`YYYY-MM-DD`, opcional)
- `estadoCivil` — texto livre (API não define enum)
- `profissao` — texto livre
- `exibirAniversario` — boolean

Fora do escopo: foto de perfil (sem endpoint de upload documentado), email e senha (não
fazem parte do payload documentado de `/me`).

## Navegação

- Nova rota `EditProfile: undefined` em `AppStackParamList` (`src/navigation/types.ts`).
- Nova tela registrada em `AppStack.tsx`.
- `ProfileScreen.tsx`: o item "Configurações da conta" passa a chamar
  `navigation.navigate('EditProfile')` em vez de não fazer nada.

## Tela — `src/screens/perfil/EditProfileScreen.tsx`

Segue o mesmo padrão visual das telas de criação em `src/screens/lideranca/` (header com
seta de voltar + título centralizado, `ScrollView` com `TextField`/`Chip`/`Button` do
design system, erro inline, loading no botão).

Campos, pré-preenchidos a partir do `user` do `AuthContext`:

- Nome completo — `TextField`.
- Sexo — dois `Chip` (Masculino/Feminino), mesmo padrão do `SignUpScreen`.
- Data de nascimento — `TextField` no formato `DD/MM/AAAA`, teclado numérico, convertida
  para `YYYY-MM-DD` no envio. Reaproveita a mesma técnica de parsing/formatação de data
  usada em `CreateEventoScreen` (`buildISO`), adaptada para data pura (sem hora).
- Estado civil — `TextField` texto livre.
- Profissão — `TextField` texto livre.
- Exibir aniversário — toggle, mesmo padrão visual do toggle "Tema escuro" que já existe
  na `ProfileScreen` (ícone `toggle`/`toggle-outline`).

Envio: monta um payload só com os campos preenchidos/alterados (mesmo padrão condicional
usado em `CreateEventoScreen.handleSubmit`), chama `authService.updateMe(payload)`,
atualiza o usuário em memória via `AuthContext`, e faz `navigation.goBack()` no sucesso.
Erro exibido inline via `extractErrorMessage`.

## Serviço — `src/services/auth.service.ts`

Novo método:

```ts
type UpdateMePayload = Partial<{
  nomeCompleto: string;
  sexo: 'Masculino' | 'Feminino';
  dataNascimento: string; // YYYY-MM-DD
  estadoCivil: string;
  profissao: string;
  exibirAniversario: boolean;
}>;

updateMe(payload: UpdateMePayload): Promise<User> // PATCH /api/auth/me
```

## AuthContext — `src/navigation/AuthContext.tsx`

Novo método exposto no `AuthContextValue`:

```ts
updateUser: (payload: UpdateMePayload) => Promise<void>;
```

Implementação: chama `authService.updateMe(payload)`, guarda o `User` retornado com
`setUser`. Não precisa relogar nem tocar no token.

## Erros e loading

Mesmo padrão já usado em todo o app: `isLoading` local no botão de salvar, `error` inline
em texto abaixo do formulário, mensagens via `extractErrorMessage(e, fallback)`.

## Fora de escopo / não decidido agora

- Upload de foto de perfil.
- Alterar email ou senha pela tela de perfil (fluxo separado, não documentado ainda).
- Validação de formato de `estadoCivil` (a API não define um enum, então não validamos
  no front além de "não vazio").
