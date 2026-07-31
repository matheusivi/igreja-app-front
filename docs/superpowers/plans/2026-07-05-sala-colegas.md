# Sala — Ver Colegas de Turma Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a member who enrolls in a sala (turma) see who else is actively enrolled, via a new screen reached automatically on enrollment and revisitable afterward.

**Architecture:** A new backend endpoint, separate from the existing leader-only participants endpoint, authorizes by "is the requester an active participant of this sala" instead of by role, and returns a minimal, non-management shape (no status/date fields). The frontend gets one new service method and one new screen, wired into the existing `CourseDetailScreen` enroll flow.

**Tech Stack:** Backend: Express, Zod, Prisma (`igreja-app-backend`). Frontend: React Native (Expo SDK 54), TypeScript, React Navigation native-stack, axios, NativeWind (`igreja-app-front`).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-05-sala-colegas-design.md`.
- **No automated tests are added in this plan** — same instruction as prior plans this project. Verification is `tsc --noEmit` in both repos plus a manual walkthrough (final task).
- **Do not run `git commit` for any step in this plan.** The user commits manually.
- The new endpoint must NOT use `authMiddleware.requireRole` — authorization is "requester has an active (`'ativo'`) matrícula in this sala," checked inside the service, not by profile/role.
- The new endpoint's response must NOT include `status` or `dataMatricula` for each colega — only `usuarioId`, `nomeCompleto`, `perfil`. That data is for the leader-only participants endpoint, which this plan does not modify.
- Do not change `GET /api/matriculas/sala/:salaId/participantes`, `listarParticipantes`, `removerParticipante`, `atualizarStatusParticipante`, or the `SalaParticipantesScreen.tsx` (leader UI) — this plan only adds new code alongside them.
- Follow existing screen conventions: header row with back arrow + centered title, `extractErrorMessage` for error text, `isLoading` state driving spinner/`Button` loading prop, `Card` for list rows.
- No new npm dependencies in either repo.

---

### Task 1: Backend — `listarColegas` endpoint

**Files:**
- Modify: `igreja-app-backend/src/dtos/matricula.dto.ts`
- Modify: `igreja-app-backend/src/services/matricula.services.ts`
- Modify: `igreja-app-backend/src/controllers/matricula.controller.ts`
- Modify: `igreja-app-backend/src/routes/matricula.routes.ts`

**Interfaces:**
- Produces: `GET /api/matriculas/sala/:salaId/colegas` (authenticated, no role restriction) →
  `{ success: true, data: ColegaSalaResponse[] }` on success, or a 403 AppError if the
  requester isn't an active participant. Consumed by `coursesService.getColegas()` in Task 2.

- [ ] **Step 1: Add the `ColegaSalaResponse` DTO**

Open `igreja-app-backend/src/dtos/matricula.dto.ts`. Add at the end of the file:

```ts
export interface ColegaSalaResponse {
  usuarioId: number;
  nomeCompleto: string;
  perfil: string;
}
```

- [ ] **Step 2: Add the service method**

Open `igreja-app-backend/src/services/matricula.services.ts`. Add `ColegaSalaResponse` to the
type-only import at the top:

```ts
import type {
  MatriculaResponse,
  ParticipanteSalaResponse,
  HistoricoCursoResponse,
  StatusMatricula,
  ListarParticipantesResponse,
  ListarHistoricoResponse,
  ColegaSalaResponse,
} from "../dtos/matricula.dto";
```

Add this method right after `buscarHistorico` (at the end of the class, before the closing
`}`):

```ts
  // ========================
  // COLEGAS DE TURMA (qualquer matriculado ativo)
  // ========================
  public async listarColegas(
    salaId: number,
    usuarioId: number,
  ): Promise<ColegaSalaResponse[]> {
    const minhaMatricula = await this.matriculaRepository.buscarMatricula(
      salaId,
      usuarioId,
    );

    if (!minhaMatricula || minhaMatricula.status !== MatriculaStatus.ATIVO) {
      throw new AppError(
        "Você precisa estar matriculado nesta turma para ver os colegas.",
        403,
      );
    }

    const participantes = await this.matriculaRepository.listarParticipantes(
      salaId,
      0,
      200,
    );

    return participantes
      .filter((p) => p.status === MatriculaStatus.ATIVO)
      .map((p) => ({
        usuarioId: p.usuario.id,
        nomeCompleto: p.usuario.nomeCompleto,
        perfil: p.usuario.perfil,
      }));
  }
```

- [ ] **Step 3: Add the controller method**

Open `igreja-app-backend/src/controllers/matricula.controller.ts`. Add this method right
after `meuHistorico` (at the end of the class, before the closing `}`):

```ts
  public listarColegas = async (
    req: AuthRequest,
    res: Response,
  ): Promise<void> => {
    const salaId = SalaIdParamSchema.parse(Number(req.params.salaId));
    const usuarioId = req.user!.id;

    const colegas = await this.matriculaService.listarColegas(salaId, usuarioId);

    res.status(200).json({
      success: true,
      data: colegas,
    });
  };
```

- [ ] **Step 4: Register the route**

Open `igreja-app-backend/src/routes/matricula.routes.ts`. Add this route right after the
`/sala/:salaId/participantes` route block and before the `removerParticipante` route:

```ts
// Lista colegas ativos de uma sala — qualquer matriculado ativo pode ver
// (autorização por matrícula, não por perfil — sem requireRole aqui de propósito)
router.get('/sala/:salaId/colegas',
    authMiddleware.authenticate,
    matriculaController.listarColegas
);
```

- [ ] **Step 5: Type-check**

Run: `cd "C:\Users\mathe\OneDrive\Área de Trabalho\igreja\igreja-app-backend" && npx tsc --noEmit --project tsconfig.json`
Expected: no errors.

- [ ] **Step 6: Do not commit — leave the change in the working tree.**

---

### Task 2: Frontend — `coursesService.getColegas`

**Files:**
- Modify: `igreja-app-front/src/services/courses.service.ts`

**Interfaces:**
- Produces: type `ColegaSala`, `coursesService.getColegas(salaId: number): Promise<ColegaSala[]>`.
  Consumed by `SalaScreen.tsx` in Task 3.

- [ ] **Step 1: Add the type and method**

Open `igreja-app-front/src/services/courses.service.ts`. Add this type after `MatriculaHistorico`:

```ts
export type ColegaSala = {
  usuarioId: number;
  nomeCompleto: string;
  perfil: string;
};
```

Add this method inside the `coursesService` object, right after `getParticipantes`:

```ts
  async getColegas(salaId: number): Promise<ColegaSala[]> {
    const { data } = await api.get(`/api/matriculas/sala/${salaId}/colegas`);
    return (data.data ?? []) as ColegaSala[];
  },
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit` (from the frontend repo root)
Expected: no errors.

- [ ] **Step 3: Do not commit — leave the change in the working tree.**

---

### Task 3: Frontend — `SalaScreen` + route

**Files:**
- Modify: `igreja-app-front/src/navigation/types.ts`
- Create: `igreja-app-front/src/screens/ensino/SalaScreen.tsx`
- Modify: `igreja-app-front/src/navigation/AppStack.tsx`

**Interfaces:**
- Consumes: `coursesService.getColegas(salaId): Promise<ColegaSala[]>` from Task 2;
  `extractErrorMessage` from `services/api`; `Card` from `components`.
- Produces: `Sala: { salaId: number; cursoNome: string }` route and `SalaScreen` component,
  consumed by Task 4 (`CourseDetailScreen`'s navigate calls).

- [ ] **Step 1: Add the route**

Open `igreja-app-front/src/navigation/types.ts`. Add `Sala: { salaId: number; cursoNome:
string };` right after `EditCurso: { id: string };`, so `AppStackParamList` reads:

```ts
export type AppStackParamList = {
  MainTabs: undefined;
  EditProfile: undefined;
  Devocionais: undefined;
  DevocionalDetail: { id: string };
  Eventos: undefined;
  CursoDetail: { id: string };
  EditCurso: { id: string };
  Sala: { salaId: number; cursoNome: string };
  GroupDetail: { id: string };
  CreateGroup: undefined;
  InviteMember: { grupoId: number; grupoNome: string };
  CreateConteudo: { tipo?: 'Devocional' | 'Estudo' | 'Aviso'; id?: string } | undefined;
  CreateEvento: { id?: string } | undefined;
  CreateSala: { cursoId: string; cursoTitulo: string };
  SalaParticipantes: { salaId: number; cursoTitulo: string };
};
```

- [ ] **Step 2: Create `SalaScreen.tsx`**

Create `igreja-app-front/src/screens/ensino/SalaScreen.tsx` with this exact content:

```tsx
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../components';
import { colors } from '../../constants/theme';
import type { AppStackParamList } from '../../navigation/types';
import { extractErrorMessage } from '../../services/api';
import { coursesService, type ColegaSala } from '../../services/courses.service';

type Props = NativeStackScreenProps<AppStackParamList, 'Sala'>;

export function SalaScreen({ route, navigation }: Props) {
  const { salaId, cursoNome } = route.params;

  const [colegas, setColegas] = useState<ColegaSala[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await coursesService.getColegas(salaId);
        setColegas(data);
      } catch (e) {
        setError(extractErrorMessage(e));
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [salaId]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center justify-between border-b border-outline-variant px-gutter py-3">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </Pressable>
        <Text className="font-serif-bold text-base text-primary" numberOfLines={1}>
          Sala — {cursoNome}
        </Text>
        <View style={{ width: 22 }} />
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.gold} />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center gap-3 px-gutter">
          <Text className="text-center font-sans text-sm text-ink-muted">{error}</Text>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Text className="font-sans-semibold text-sm text-secondary">Voltar</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerClassName="gap-md px-gutter py-lg">
          <Text className="font-sans text-sm text-ink-muted">
            {colegas.length} colega{colegas.length !== 1 ? 's' : ''} nesta turma
          </Text>

          {colegas.length > 0 ? (
            <View className="gap-2">
              {colegas.map((colega) => (
                <Card key={colega.usuarioId} contentClassName="flex-row items-center gap-3">
                  <View className="h-11 w-11 items-center justify-center rounded-full bg-surface-container-high">
                    <Text className="font-sans-semibold text-ink">
                      {colega.nomeCompleto.trim().charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text className="font-sans-semibold text-sm text-ink">
                      {colega.nomeCompleto}
                    </Text>
                    <Text className="font-sans text-xs text-ink-muted">{colega.perfil}</Text>
                  </View>
                </Card>
              ))}
            </View>
          ) : (
            <Card contentClassName="items-center py-6">
              <Text className="font-sans text-sm text-ink-muted">
                Nenhum colega matriculado ainda.
              </Text>
            </Card>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
```

- [ ] **Step 3: Register the screen in `AppStack.tsx`**

Open `igreja-app-front/src/navigation/AppStack.tsx`. Add the import after the
`EditCursoScreen` import:

```ts
import { SalaScreen } from '../screens/ensino/SalaScreen';
```

Add the `<Stack.Screen>` entry right after `<Stack.Screen name="EditCurso" component={EditCursoScreen} />`:

```tsx
      <Stack.Screen name="Sala" component={SalaScreen} />
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit` (from the frontend repo root)
Expected: no errors in `SalaScreen.tsx`, `types.ts`, or `AppStack.tsx`.

- [ ] **Step 5: Do not commit — leave the change in the working tree.**

---

### Task 4: Frontend — wire `CourseDetailScreen`

**Files:**
- Modify: `igreja-app-front/src/screens/ensino/CourseDetailScreen.tsx`

**Interfaces:**
- Consumes: `Sala: { salaId: number; cursoNome: string }` route from Task 3.

- [ ] **Step 1: Navigate to `Sala` automatically on successful enroll**

Find:

```tsx
  async function handleEnroll(salaId: number) {
    setEnrollingId(salaId);
    setActionError(null);
    try {
      await coursesService.enroll(salaId);
      setEnrolledSalaIds((prev) => new Set([...prev, salaId]));
    } catch (e) {
      setActionError(extractErrorMessage(e, 'Não foi possível concluir a matrícula.'));
    } finally {
      setEnrollingId(null);
    }
  }
```

Replace with:

```tsx
  async function handleEnroll(salaId: number) {
    setEnrollingId(salaId);
    setActionError(null);
    try {
      await coursesService.enroll(salaId);
      setEnrolledSalaIds((prev) => new Set([...prev, salaId]));
      navigation.navigate('Sala', { salaId, cursoNome: curso!.nome });
    } catch (e) {
      setActionError(extractErrorMessage(e, 'Não foi possível concluir a matrícula.'));
    } finally {
      setEnrollingId(null);
    }
  }
```

- [ ] **Step 2: Add "Ver colegas da turma" button for already-enrolled salas**

Find:

```tsx
                    {enrolled ? (
                      <Button
                        label="Cancelar matrícula"
                        variant="secondary"
                        loading={processing}
                        onPress={() => handleCancel(sala.id)}
                      />
                    ) : (
```

Replace with:

```tsx
                    {enrolled ? (
                      <>
                        <Button
                          label="Ver colegas da turma"
                          variant="secondary"
                          icon={<Ionicons name="people-outline" size={14} color={colors.secondary} />}
                          onPress={() =>
                            navigation.navigate('Sala', { salaId: sala.id, cursoNome: curso!.nome })
                          }
                        />
                        <Button
                          label="Cancelar matrícula"
                          variant="secondary"
                          loading={processing}
                          onPress={() => handleCancel(sala.id)}
                        />
                      </>
                    ) : (
```

(The `enrolled` block's JSX now returns a fragment with two `Button`s instead of one — the
following `) : (` and the "Matricular-se nesta turma" `Button` branch, and the closing `)}`
after it, are unchanged.)

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit` (from the frontend repo root)
Expected: zero errors, project-wide.

- [ ] **Step 4: Do not commit — leave the change in the working tree.**

---

### Task 5: Manual end-to-end verification

**Files:** none (verification only).

- [ ] **Step 1: Confirm both servers are reachable**

Backend running (`npm run dev` in `igreja-app-backend`, so Task 1's route is picked up by
nodemon), and `igreja-app-front/src/config.ts`'s `API_BASE_URL` pointing at the current
machine IP.

- [ ] **Step 2: Run the app**

Run: `cd "C:\Users\mathe\OneDrive\Área de Trabalho\igreja\igreja-app-front" && npx expo start`
Log in with at least two different accounts that can both enroll in the same sala (a second
device/simulator or two Expo Go sessions, if available — otherwise test with one account and
verify the list shows yourself).

- [ ] **Step 3: Exercise the flow**

1. Open a course with an available turma, tap **Matricular-se nesta turma**.
2. Expected: navigates automatically to the new **Sala** screen, showing yourself in the
   colegas list (at least).
3. Go back to the course — the turma's card should now show two buttons: **Ver colegas da
   turma** and **Cancelar matrícula**.
4. Tap **Ver colegas da turma** — should reopen the same `Sala` screen without re-enrolling.
5. If a second account is available: enroll it in the same sala, then confirm both accounts
   appear in each other's `Sala` colegas list.
6. Cancel the matrícula from `CourseDetailScreen`, then try to reach `Sala` for that sala
   again (e.g. by re-navigating there manually via dev tools, or simply confirm the "Ver
   colegas da turma" button disappears once `enrolled` is false again) — should not be
   reachable through normal UI once canceled.

- [ ] **Step 4: Report results**

No commit for this task. If any step fails, identify which task's files are responsible,
fix the root cause there, re-run the relevant `tsc --noEmit`, and re-test before moving on.
