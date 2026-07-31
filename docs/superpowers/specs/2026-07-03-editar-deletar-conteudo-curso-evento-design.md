# Editar/Deletar Conteúdo, Curso e Evento — Design

## Contexto

Gap identificado na revisão do estado atual: os services já têm `update()`/`remove()` (ou
quase — ver abaixo) para conteúdos, cursos e eventos, mas nenhuma tela chama isso, só
criação. Investigando o backend para desenhar essa feature, foram encontrados dois bugs
pré-existentes do mesmo tipo do que já foi corrigido em Grupos Familiares: mismatch de
formato de dados entre o que o front espera e o que a API realmente devolve, em **Cursos**
e **Conteúdos**. Por decisão do usuário, esses bugs são corrigidos como parte deste pacote,
antes de construir editar/deletar em cima deles.

## Escopo

1. Corrigir `content.service.ts` (tipo `Conteudo`) e seus 3 consumidores.
2. Corrigir `courses.service.ts` (tipo `Curso`) e seus 2 consumidores.
3. Backend: adicionar `criadorId` (e `descricao`, que também falta) na listagem de eventos
   por mês — sem isso o front não tem como decidir quem pode editar/deletar cada evento.
4. Editar/deletar Conteúdo, reaproveitando `CreateConteudoScreen`.
5. Editar/deletar Evento, reaproveitando `CreateEventoScreen`.
6. Editar/deletar Curso, em uma tela nova `EditCursoScreen` (não existe tela de *criar*
   curso hoje — fora de escopo, não foi pedido).

Fora de escopo: criar curso pela UI (endpoint existe, tela não — não foi pedido).

## 1. Bug de formato — `content.service.ts`

A API (`ConteudoService.formatarResponse`, usada por `create`/`getById`/`list`) sempre
devolve:

```json
{
  "id": 1, "tipo": "Devocional", "titulo": "...", "texto": "...", "imagemUrl": null,
  "videoUrl": null, "formato": "texto", "dataPublicacao": "2026-...", "principal": false,
  "autor": { "id": 5, "nomeCompleto": "...", "perfil": "Líder" }
}
```

O tipo `Conteudo` atual no front assume `createdAt` (não existe — é `dataPublicacao`),
`autorNome?: string` (não existe — é `autor: {id, nomeCompleto, perfil}`) e
`dataValidade` na resposta (a API aceita esse campo na entrada, mas não devolve na saída).

Novo tipo:

```ts
export type Conteudo = {
  id: number;
  tipo: 'Estudo' | 'Devocional' | 'Aviso' | 'Material' | 'Apresentacao';
  titulo: string;
  formato: 'texto' | 'imagem' | 'vídeo' | 'combinacao';
  texto: string | null;
  imagemUrl: string | null;
  videoUrl: string | null;
  principal: boolean;
  dataPublicacao: string;
  autor: { id: number; nomeCompleto: string; perfil: string };
};
```

`CreateConteudoPayload` (usado só para enviar, não para ler) não muda — `dataValidade`
continua aceito na criação/edição, só não vem de volta na leitura.

Consumidores a corrigir: `HomeScreen.tsx` (`aviso.createdAt` → `aviso.dataPublicacao`),
`DevotionalsListScreen.tsx` (`item.autorNome` → `item.autor.nomeCompleto`, em destaque e na
lista), `DevotionalDetailScreen.tsx` (`conteudo.autorNome` → `conteudo.autor.nomeCompleto`,
`conteudo.createdAt` → `conteudo.dataPublicacao`).

## 2. Bug de formato — `courses.service.ts`

A API (`CursoService.formatarResponse`) sempre devolve:

```json
{
  "id": 1, "nome": "...", "descricaoMaterial": "...", "categoria": "Geral",
  "criador": { "id": 5, "nomeCompleto": "...", "perfil": "Pastor" }
}
```

Sem `titulo` (é `nome`), sem `descricao` (é `descricaoMaterial`), sem `criadorNome` plano
(é `criador: {id, nomeCompleto, perfil}`), sem `createdAt` (não existe).

Novo tipo:

```ts
export type Curso = {
  id: number;
  nome: string;
  descricaoMaterial: string | null;
  categoria: 'Homens' | 'Mulheres' | 'Casais' | 'Jovens' | 'Geral' | 'Batismo';
  criador: { id: number; nomeCompleto: string; perfil: string };
};
```

Consumidores a corrigir: `CoursesListScreen.tsx` (`curso.titulo` → `curso.nome`,
`curso.descricao` → `curso.descricaoMaterial`, `curso.criadorNome` →
`curso.criador.nomeCompleto`), `CourseDetailScreen.tsx` (idem, incluindo os dois lugares
que usam `curso!.titulo` ao navegar para `CreateSala`).

Novos métodos em `coursesService` (a API já suporta, o front não chama ainda):

```ts
updateCurso(id: number, payload: { nome?: string; descricaoMaterial?: string; categoria?: string }): Promise<Curso>  // PUT /api/cursos/:id
deleteCurso(id: number): Promise<void>  // DELETE /api/cursos/:id
```

## 3. Backend — `criadorId` e `descricao` na listagem de eventos por mês

`GET /api/eventos?mes=&ano=` devolve ocorrências (`EventoOcorrencia`) sem informação de
quem criou o evento — impossível decidir no front quem pode editar/deletar. Também falta
`descricao`, que o front já tenta exibir mas nunca recebe.

`igreja-app-backend/src/dtos/evento.dto.ts` — `EventoOcorrencia` ganha dois campos:

```ts
export interface EventoOcorrencia {
  id: number;
  titulo: string;
  descricao: string | null;
  tipo: string;
  cor: string | null;
  dataInicio: Date;
  dataFim: Date | null;
  local: string | null;
  recorrencia: string;
  criadorId: number;
}
```

`igreja-app-backend/src/services/evento.services.ts` — `toOcorrencia` passa a incluir os
dois campos ao montar o objeto (o dado já está disponível em `evento`, só não estava sendo
copiado).

Nenhuma outra rota/resposta de evento muda — `getById` (`EventoResponse`) já tem
`criador`/`descricao` completos.

Frontend `EventoItem` (em `events.service.ts`) ganha `criadorId: number` (campo novo,
obrigatório — já vem sempre preenchido). `descricao` já existe no tipo, só passa a chegar
de verdade.

Novo método em `eventsService` (a API já suporta, o front não chama ainda):

```ts
deleteEvento(id: number): Promise<void>  // DELETE /api/eventos/:id
```

## 4. Editar/deletar Conteúdo

`CreateConteudoScreen` (rota `CreateConteudo`) ganha um `id?: string` opcional nos params.
Se vier, um `useEffect` busca `contentService.get(id)` e pré-preenche todos os campos do
formulário; título do header vira "Editar Conteúdo"; o botão vira "Salvar alterações" e
chama `contentService.update(id, payload)` em vez de `contentService.create(payload)`.

`DevotionalsListScreen` e `DevotionalDetailScreen` ganham ícones de editar (lápis) e
deletar (lixeira), visíveis quando `user?.id === item.autor.id` **ou**
`['Pastor', 'Administrador'].includes(user?.perfil ?? '')` — regra real confirmada no
backend (`conteudo.services.ts`: dono OU Pastor OU Administrador podem editar/deletar;
Líder sozinho só se for o autor). Editar navega para `CreateConteudo` com o `id`. Deletar
abre `Alert.alert` (nativo, sem dependência nova) pedindo confirmação; ao confirmar, chama
`contentService.remove(id)` e atualiza a lista local removendo o item.

## 5. Editar/deletar Evento

Mesmo padrão: `CreateEventoScreen` (rota `CreateEvento`) ganha `id?: string` opcional,
pré-carrega via `eventsService` (precisa de um `getEvento(id)` novo — a API tem
`GET /api/eventos/:id`, o front ainda não chama), pré-preenche, muda título/botão, chama
`updateEvento(id, payload)`.

`EventsScreen`: cada card de evento ganha editar/deletar quando `user?.id ===
event.criadorId` ou perfil Pastor/Administrador. Deletar usa o mesmo padrão de
`Alert.alert` + `eventsService.deleteEvento(id)` + recarrega o mês atual.

`EventoItem` (o tipo usado pela listagem por mês) **não tem** `diaSemana`, `diaDoMes`, nem
`dataFimRecorrencia` — campos que `CreateEventoScreen` precisa para pré-preencher a edição
de um evento recorrente. `GET /api/eventos/:id` (`EventoResponse` no backend) já devolve
esses campos; só falta o front ter um tipo e um método pra isso. Novo tipo e método em
`events.service.ts`:

```ts
export type EventoDetalhe = EventoItem & {
  diaSemana: number | null;
  diaDoMes: number | null;
  dataFimRecorrencia: string | null;
};

// dentro de eventsService:
getEvento(id: string | number): Promise<EventoDetalhe> // GET /api/eventos/:id
```

## 6. Editar/deletar Curso

Nova tela `src/screens/ensino/EditCursoScreen.tsx`, mesmo padrão visual das outras (header
com seta + título, `TextField` para nome/descrição, chips de categoria, botão salvar).
Pré-carrega via `coursesService.getCurso(id)`, chama `updateCurso(id, payload)`.

`CourseDetailScreen` ganha um ícone de editar no header (troca o `share-outline` decorativo
que já existe e não faz nada — mesmo ajuste que fizemos em `GroupDetailScreen`) e um botão
"Excluir curso" visível quando `user?.id === curso.criador.id` ou perfil Pastor/Administrador.
Deletar usa `Alert.alert` + `coursesService.deleteCurso(id)`. Se a API responder 409 (curso
com alunos matriculados ativos — regra já existente no backend,
`curso.services.ts::delete`), a mensagem de erro do backend
("Este curso não pode ser excluído pois há alunos com matrículas ativas...") é exibida via
`extractErrorMessage`, sem tratamento especial — o backend já dá a mensagem certa.

## Erros e loading

Mesmo padrão de sempre: `isLoading` no botão, erro inline via `extractErrorMessage`, sem
mensagens de fallback customizadas quando o backend já manda uma mensagem clara (ex: o erro
409 de curso com alunos ativos).

## Fora de escopo / não decidido agora

- Criar curso pela UI (não foi pedido).
- Editar/deletar Sala (turma) — não foi pedido, só Conteúdo/Curso/Evento.
- Qualquer mudança de UI em Grupos Familiares, Pedidos de Oração — não relacionados.
