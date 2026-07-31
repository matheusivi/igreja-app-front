# Cursos — Criar, Buscar e Corrigir Filtro — Design

## Contexto

Três pedidos relacionados à tela "Ensino" (`CoursesListScreen`):

1. Não existe nenhuma tela para criar curso — só existe criar *turma* dentro de um curso já
   existente. Gap já identificado e deliberadamente deixado de fora do escopo de
   "editar/deletar curso"; agora foi pedido.
2. O usuário achou que faltavam as categorias "Jovens" e "Batismo" no filtro. Investigando,
   elas já existem no código — o problema real é que a lista de chips de categoria usa
   `ScrollView horizontal` com `showsHorizontalScrollIndicator={false}`, escondendo o
   indicador de que dá pra rolar. Sem indicador visual, fica fácil não perceber que existem
   mais categorias à direita.
3. Falta um campo de busca por nome do curso ou do criador da turma.

## Escopo

- Trocar a rolagem horizontal escondida dos chips de categoria por uma lista que quebra
  linha (`flex-row flex-wrap`), mostrando todos os 7 chips de uma vez.
- Campo de busca novo, filtrando no cliente por nome do curso OU nome do criador.
- Nova tela `CreateCursoScreen.tsx`, separada de `EditCursoScreen.tsx` (que continua só
  edição, sem mudanças). Botão "Criar curso" em `CoursesListScreen`, visível só para
  Líder/Pastor/Administrador.

Fora de escopo: mudar `EditCursoScreen.tsx`; busca no servidor (a lista já vem inteira do
backend, filtro é só no cliente); qualquer mudança no back-end.

## 1. Filtro de categoria

Em `CoursesListScreen.tsx`, troca:

```tsx
<ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-gutter px-gutter">
  <View className="flex-row gap-2 pr-gutter">
    {filters.map((filter) => (...))}
  </View>
</ScrollView>
```

por:

```tsx
<View className="flex-row flex-wrap gap-2">
  {filters.map((filter) => (...))}
</View>
```

Mesmo padrão já usado nos chips de categoria de `EditCursoScreen.tsx` e nos chips de tipo de
`CreateEventoScreen.tsx`. A lista de `filters` (com Jovens e Batismo já incluídos) não muda.

## 2. Busca por nome do curso ou do criador

Novo `TextField` "Buscar por curso ou responsável" logo abaixo do `SectionHeader`, com um
`useState<string>` `busca`. O `useMemo` que já filtra por categoria (`filteredCursos`) passa
a filtrar por categoria **e** por busca:

```ts
const filteredCursos = useMemo(() => {
  let list = activeFilter === 'todos' ? cursos : cursos.filter((c) => c.categoria === activeFilter);
  const termo = busca.trim().toLowerCase();
  if (termo) {
    list = list.filter(
      (c) =>
        c.nome.toLowerCase().includes(termo) ||
        c.criador.nomeCompleto.toLowerCase().includes(termo),
    );
  }
  return list;
}, [cursos, activeFilter, busca]);
```

Sem chamada nova à API — `cursos` já é a lista completa (até 50 itens, limite já existente em
`listCursos`).

## 3. Criar curso

`src/services/courses.service.ts` ganha:

```ts
createCurso(payload: { nome: string; descricaoMaterial?: string; categoria: string }): Promise<Curso>  // POST /api/cursos
```

Nova tela `src/screens/ensino/CreateCursoScreen.tsx`, mesmo padrão visual de
`EditCursoScreen.tsx` (header com seta de voltar + título, `TextField` nome/descrição, chips
de categoria, botão salvar) — mas com formulário vazio (sem `useEffect` de carregar dados) e
chamando `createCurso` em vez de `updateCurso`. Ao criar com sucesso, navega
(`navigation.replace`) para `CursoDetail` do curso recém-criado.

Rota nova `CreateCurso: undefined` em `AppStackParamList` + registrada em `AppStack.tsx`.

`CoursesListScreen.tsx` ganha `useAuth()` (ainda não importado nessa tela) para checar
`isLeader` (mesmo critério usado em todo o app: `['Líder', 'Pastor',
'Administrador'].includes(user?.perfil ?? '')`), e o `SectionHeader` do topo ganha
`actionLabel="Criar curso" onActionPress={...}` quando `isLeader` for true — mesmo padrão do
botão "Criar grupo" em `GroupsScreen.tsx`.

## Erros e loading

Mesmo padrão de sempre: `isLoading` no botão, erro inline via `extractErrorMessage`.

## Fora de escopo / não decidido agora

- Busca no servidor / paginação (a lista de cursos é pequena o suficiente pra filtrar no
  cliente).
- Editar categoria/regras de negócio de categorias.
- Qualquer mudança em `EditCursoScreen.tsx`.
