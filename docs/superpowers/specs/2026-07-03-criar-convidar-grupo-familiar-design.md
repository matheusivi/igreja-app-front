# Criar Grupo Familiar / Convidar Membro — Design

## Contexto

Gap identificado na revisão do estado atual da integração com a API: não existe
nenhuma tela para `POST /api/familias` (criar grupo) nem `POST /api/familias/:grupoId/convidar`
(convidar membro), e a busca de membros (`GET /api/usuarios`) não é usada em nenhuma tela.

Durante a exploração do backend (`igreja-app-backend`) para desenhar essa feature, foram
encontrados dois problemas pré-existentes no front que também entram no escopo deste
documento, porque tocam exatamente os mesmos arquivos:

1. **Mismatch de formato de dados.** `src/services/groups.service.ts` define `GrupoResumo`
   como um formato achatado (`{ id (membroId), grupoId, nome, liderNome, status,
   totalMembros? }`), mas o backend (`GrupoFamiliarService.formatarResponse`, usado tanto
   por `getById` quanto por `getByUsuario`) sempre devolve um objeto aninhado:
   `{ id, nome, membros: MembroFamiliaResponse[] }`, sem nenhum campo `liderNome`,
   `totalMembros` ou `status` no nível raiz. Não existe conceito de "líder" no modelo do
   backend — só `criadorUsuarioId` no grupo, e o próprio criador vira o primeiro membro do
   array `membros` com `parentesco: "Criador"` (ver `GrupoFamiliarService.create`).
2. **Convites pendentes não são alcançáveis.** `GET /api/familias/usuario/:usuarioId`
   (`GrupoFamiliarRepository.buscarPorUsuario`) filtra `membros: { some: { usuarioId,
   status: 'aceito' } }` — convites com `status: 'pendente'` nunca aparecem nessa consulta.
   Não existe nenhum outro endpoint que liste os convites pendentes do usuário logado. A
   seção "Convites pendentes" que já existe em `GroupsScreen.tsx` nunca teve como receber
   dados reais.

## Escopo

- Novo endpoint no backend para listar convites pendentes do usuário logado.
- Corrigir os tipos e o parsing de `groups.service.ts` para bater com o formato real da API.
- `groupsService.createGroup`, `groupsService.inviteMember`, `groupsService.listPendingInvites`.
- `usersService.search` para busca de membros.
- Telas novas: criar grupo, convidar membro (buscar + selecionar + parentesco opcional).
- Botão "Criar grupo" sempre visível em `GroupsScreen`; botão "Convidar membro" em
  `GroupDetailScreen`.

Fora de escopo: remover membro do grupo (`DELETE /api/familias/:grupoId/membros/:usuarioId`
já existe na API e no service `groupsService`, mas nenhuma tela usa — fica para uma
iteração futura, não foi pedido agora).

## Backend (`igreja-app-backend`)

Nova rota, registrada **antes** de `GET /:grupoId` em `src/routes/grupoFamiliar.routes.ts`
(senão o Express casa `/convites/pendentes` com o parâmetro `:grupoId` da rota existente):

```
GET /api/familias/convites/pendentes
```

- `GrupoFamiliarRepository.buscarConvitesPendentes(usuarioId: number)` — nova função em
  `src/repository/grupoFamiliar.repository.ts`, consulta `prisma.membroFamilia.findMany`
  com `where: { usuarioId, status: 'pendente' }`, incluindo `grupoFamiliar: { select: { id,
  nome } }` e `convidadoPor: { select: { id, nomeCompleto } }`.
- `GrupoFamiliarService.getConvitesPendentes(usuarioId: number)` — nova função em
  `src/services/grupoFamiliar.services.ts`, mapeia o resultado do repositório para:

```ts
export interface ConviteFamiliaPendenteResponse {
  id: number;               // id do membroFamilia — usado no PATCH /convites/:membroId/responder
  grupoId: number;
  nomeGrupo: string | null;
  parentesco: string | null;
  convidadoPor: { id: number; nomeCompleto: string };
}
```

- `GrupoFamiliarController.getConvitesPendentes` — novo método em
  `src/controllers/grupoFamiliar.controller.ts`, chama o service com `req.user!.id`,
  responde `{ success: true, data: ConviteFamiliaPendenteResponse[] }`.
- Teste novo em `src/services/__tests__/grupoFamiliar.service.test.ts` cobrindo
  `getConvitesPendentes` (caso com convites e caso sem nenhum), seguindo o padrão dos
  testes existentes no mesmo arquivo (mock do repositório).

Nenhuma mudança nos endpoints e formatos de resposta já existentes (`create`, `convidar`,
`responderConvite`, `getById`, `getByUsuario`, `removerMembro`) — eles continuam exatamente
como estão hoje, com sua cobertura de teste já existente intacta.

## Frontend — `src/services/groups.service.ts`

Tipos reescritos para bater com o formato real:

```ts
export type MembroFamilia = {
  id: number; // id do membroFamilia — usado no PATCH /convites/:membroId/responder
  parentesco: string | null;
  status: 'aceito' | 'pendente';
  usuario: {
    id: number;
    nomeCompleto: string;
    perfil: string;
    fotoUrl: string | null;
  };
  convidadoPor: { id: number; nomeCompleto: string };
};

export type GrupoFamiliar = {
  id: number;
  nome: string | null;
  membros: MembroFamilia[];
};

export type ConvitePendente = {
  id: number; // membroId
  grupoId: number;
  nomeGrupo: string | null;
  parentesco: string | null;
  convidadoPor: { id: number; nomeCompleto: string };
};
```

Funções auxiliares (mesmo espírito de `makeExcerpt`/`formatEventDate` já usadas em outros
services):

```ts
export function getCriadorNome(grupo: GrupoFamiliar): string | null {
  const criador = grupo.membros.find((m) => m.parentesco === 'Criador');
  return criador?.usuario.nomeCompleto ?? null;
}

export function countMembrosAtivos(grupo: GrupoFamiliar): number {
  return grupo.membros.filter((m) => m.status === 'aceito').length;
}
```

Novos métodos em `groupsService` (mantendo os já existentes — `getGroupDetail`,
`respondInvite`):

```ts
getUserGroups(usuarioId: number): Promise<GrupoFamiliar[]>   // GET /api/familias/usuario/:usuarioId — troca o tipo de retorno
listPendingInvites(): Promise<ConvitePendente[]>              // GET /api/familias/convites/pendentes
createGroup(nome?: string): Promise<GrupoFamiliar>            // POST /api/familias
inviteMember(grupoId: number, usuarioId: number, parentesco?: string): Promise<void>  // POST /api/familias/:grupoId/convidar
```

`getGroupDetail` já existente muda só o tipo de retorno (`GrupoDetalhe` → `GrupoFamiliar`).

## Frontend — `src/services/users.service.ts`

```ts
export type UsuarioResumo = {
  id: number;
  nomeCompleto: string;
  fotoUrl: string | null;
  perfil: string;
};

// dentro de usersService:
search(busca: string, page = 1, limit = 20): Promise<UsuarioResumo[]>  // GET /api/usuarios?busca=&page=&limit=
```

## Frontend — telas

### `GroupsScreen.tsx`

- Usa `getCriadorNome`/`countMembrosAtivos` no lugar dos campos `liderNome`/`totalMembros`
  que não existem mais. Texto muda de "Líder: {liderNome}" para "Criado por {criadorNome}".
- `SectionHeader` do topo ganha `actionLabel="Criar grupo" onActionPress={() =>
  navigation.navigate('CreateGroup')}` — sempre visível, não só no estado vazio.
- Convites pendentes vêm de `groupsService.listPendingInvites()` (chamada em paralelo com
  `getUserGroups`, via `Promise.allSettled`, mesmo padrão já usado na `HomeScreen`). O botão
  "Aceitar"/"Recusar" continua chamando `respondInvite(invite.id, status)` — sem mudança
  nessa parte, só a origem dos dados muda.

### `src/screens/grupos/CreateGroupScreen.tsx` (nova)

Segue o padrão visual das telas de criação existentes (`CreateEventoScreen`): header com
seta de voltar + título centralizado, um `TextField` opcional "Nome do grupo (opcional)",
botão "Criar grupo" com loading/erro inline. Ao ter sucesso, chama
`navigation.replace('GroupDetail', { id: String(grupoCriado.id) })` (replace, não push, para
não deixar a tela de criação no histórico de volta).

### `src/screens/grupos/InviteMemberScreen.tsx` (nova)

Recebe `{ grupoId: number; grupoNome: string }` via params. Um `TextField` de busca no topo
(sem debounce automático — busca dispara ao tocar um botão "Buscar" ou ao submeter o
teclado, para manter simples e não introduzir uma dependência de debounce). Lista de
resultados de `usersService.search(busca)` em `Card`s tocáveis; tocar um resultado
seleciona o usuário (destaca visualmente) e revela um `TextField` opcional "Parentesco (ex:
Filho, Cônjuge)" mais um botão "Enviar convite". Trata os dois erros documentados da API com
mensagem específica via `extractErrorMessage`: convidar a si mesmo (400) e usuário já
convidado/já é membro (409) — ambos já vêm com mensagem pronta do backend
(`AppError` message), então basta exibir `extractErrorMessage(e)` sem mensagem de fallback
customizada para esses casos.

### `GroupDetailScreen.tsx`

- Header ganha um ícone "Convidar membro" (`person-add-outline`) ao lado do ícone de
  compartilhar já existente, navegando para `InviteMemberScreen` com
  `{ grupoId: grupo.id, grupoNome: grupo.nome ?? '' }`.
- Troca o tipo `GrupoDetalhe` → `GrupoFamiliar`. A tela hoje lê campos achatados
  (`membro.nomeCompleto`, `membro.perfil`) que não existem no novo tipo — passam a ler
  `membro.usuario.nomeCompleto` e `membro.parentesco ?? membro.usuario.perfil`. O card de
  cabeçalho hoje usa `grupo.totalMembros` (opcional, vindo do tipo antigo) — passa a usar
  `countMembrosAtivos(grupo)`.

### `ProfileScreen.tsx`

Também consome `groupsService.getUserGroups`, na aba "Família". Como esse método agora
devolve só grupos aceitos (o backend já filtra `status: 'aceito'`), o
`.filter((g) => g.status === 'aceito')` local é removido — não existe mais `status` no tipo.
`grupo.grupoId` vira `grupo.id`, e `Líder: {grupo.liderNome}` vira `Criado por
{getCriadorNome(grupo)}`. Tipo do state `GrupoResumo[]` → `GrupoFamiliar[]`.

### Navegação

`src/navigation/types.ts` — `AppStackParamList` ganha:

```ts
CreateGroup: undefined;
InviteMember: { grupoId: number; grupoNome: string };
```

`src/navigation/AppStack.tsx` — registra os dois novos `<Stack.Screen>`.

## Erros e loading

Mesmo padrão já usado em todo o app: `isLoading` local no botão de ação, `error` inline via
`extractErrorMessage`, sem mensagens de fallback customizadas quando a API já manda uma
mensagem clara (convidar a si mesmo, usuário já convidado).

## Fora de escopo / não decidido agora

- Remover membro do grupo pela UI (endpoint e service já existem, tela não).
- Debounce/busca automática enquanto digita no `InviteMemberScreen` — busca é manual
  (botão/submit) nesta primeira versão.
- Filtro por perfil/sexo na busca de membros (a API aceita, a tela não expõe por enquanto).
