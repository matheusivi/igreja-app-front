# Sala — Ver Colegas de Turma — Design

## Contexto

Depois de corrigir os bugs de matrícula (status `'ativa'`/`'ativo'` e o formato do histórico),
o usuário notou que hoje matricular-se numa turma não leva a lugar nenhum além de um
checkbox visual — não existe nenhuma visão de "sala" com quem mais está matriculado. A API
já expõe isso, mas só para Líder/Pastor/Administrador
(`GET /api/matriculas/sala/:salaId/participantes`, restrito por
`authMiddleware.requireRole(['Administrador', 'Pastor', 'Líder'])`). Um Membro comum não
consegue chamar esse endpoint hoje.

## Escopo

- Novo endpoint no backend, separado do endpoint de líder, que qualquer usuário **com
  matrícula ativa na sala** pode chamar, devolvendo só os colegas ativos (sem dados de
  gerenciamento como status ou data de matrícula).
- Nova tela no front mostrando essa lista.
- Navegação automática pra essa tela ao matricular com sucesso.
- Botão persistente pra voltar à tela enquanto estiver matriculado.

Fora de escopo: chat, posts, ou qualquer interação entre colegas — só a lista de quem está
na turma. Não muda nada do endpoint/tela de participantes do líder (que continua com
status/gerenciamento). Não é uma aba fixa nova na barra de navegação.

## Backend — `igreja-app-backend`

Novo endpoint:

```
GET /api/matriculas/sala/:salaId/colegas
```

- Rota registrada em `src/routes/matricula.routes.ts`, autenticada mas **sem**
  `requireRole` — a autorização é por matrícula ativa, verificada dentro do service, não por
  perfil.
- `MatriculaService.listarColegas(salaId, usuarioId)`:
  1. Busca a matrícula do próprio requisitante nessa sala via `buscarMatricula(salaId,
     usuarioId)` (método já existente no repositório).
  2. Se não existir ou `status !== 'ativo'`, lança `AppError('Você precisa estar
     matriculado nesta turma para ver os colegas.', 403)`.
  3. Busca os participantes da sala (reaproveita `matriculaRepository.listarParticipantes`,
     já existente) e filtra só os com `status === 'ativo'`.
  4. Retorna `{ usuarioId, nomeCompleto, perfil }[]` — sem `dataMatricula` nem `status` (não
     é dado de gerenciamento, é só uma lista de colegas).
- Controller `listarColegas` no `MatriculaController`, resposta
  `{ success: true, data: ColegaSalaResponse[] }`.
- DTO novo `ColegaSalaResponse = { usuarioId: number; nomeCompleto: string; perfil: string }`
  em `matricula.dto.ts`.

## Frontend — `igreja-app-front`

`src/services/courses.service.ts` ganha:

```ts
export type ColegaSala = { usuarioId: number; nomeCompleto: string; perfil: string };

// dentro de coursesService:
getColegas(salaId: number): Promise<ColegaSala[]>  // GET /api/matriculas/sala/:salaId/colegas
```

Nova tela `src/screens/ensino/SalaScreen.tsx`, rota `Sala: { salaId: number; cursoNome:
string }` em `AppStackParamList` + registrada em `AppStack.tsx`. Mesmo padrão visual das
outras telas de detalhe (header com seta de voltar + título, `Card` por colega com inicial
do nome em círculo — mesmo componente `Avatar` inline usado em `GroupsScreen.tsx`), erro via
`extractErrorMessage`, loading com `ActivityIndicator`.

`CourseDetailScreen.tsx`:
- `handleEnroll`, ao suceder, navega automaticamente para `Sala` com
  `{ salaId, cursoNome: curso!.nome }` em vez de só atualizar o estado local.
- Quando `enrolled` for `true` para uma sala, o card ganha um segundo botão "Ver colegas da
  turma" (variant secondary) ao lado de "Cancelar matrícula", navegando pra `Sala` com os
  mesmos parâmetros.

## Erros e loading

Mesmo padrão de sempre. Se o usuário cancelar a matrícula enquanto está na tela `Sala` (não
deveria ser possível pela UI, mas por segurança) e tentar recarregar, o backend devolve 403
com mensagem clara, exibida via `extractErrorMessage`.

## Fora de escopo / não decidido agora

- Ver colegas de turmas já concluídas ou que você já cancelou — só turmas ativas.
- Qualquer forma de interação entre colegas (mensagens, perfil clicável, etc.).
- Mudar o endpoint/tela de participantes do líder.
