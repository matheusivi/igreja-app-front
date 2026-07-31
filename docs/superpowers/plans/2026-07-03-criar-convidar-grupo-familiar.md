# Criar Grupo Familiar / Convidar Membro Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a user create a family group and invite another member into it, and fix the pre-existing data-shape mismatch between `groups.service.ts` and the real backend response that was silently breaking the groups UI.

**Architecture:** One new backend endpoint (`GET /api/familias/convites/pendentes`) fills a real gap — there was no way to list a user's pending invites. On the frontend, `groups.service.ts` is rewritten to match the backend's actual nested response shape (`{ id, nome, membros: [...] }`, no `líder`/`totalMembros`/flat `status`), with two small helper functions deriving what the UI needs. Two new screens (`CreateGroupScreen`, `InviteMemberScreen`) and targeted fixes to three existing screens (`GroupsScreen`, `GroupDetailScreen`, `ProfileScreen`) consume the corrected types.

**Tech Stack:** Backend: Express, Zod, Prisma (`igreja-app-backend`). Frontend: React Native (Expo SDK 54), TypeScript, React Navigation native-stack, axios, NativeWind (`igreja-app-front`).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-03-criar-convidar-grupo-familiar-design.md`.
- **No automated tests are added in this plan** — the user explicitly asked to leave testing alone this round. Verification is `tsc --noEmit` in both repos plus a manual walkthrough (final task).
- **Do not run `git commit` for any step in this plan.** The user commits manually. Every "Step" that would normally say "Commit" is replaced with "Do not commit — leave the change in the working tree."
- Do not change the response shape of the existing `create`, `convidar`, `responderConvite`, `getById`, `getByUsuario`, `removerMembro` backend endpoints — only add the new one.
- New backend route `GET /api/familias/convites/pendentes` must be registered **before** `GET /:grupoId` in `src/routes/grupoFamiliar.routes.ts`, or Express will match it against the `:grupoId` param route instead.
- Follow existing screen conventions: header row with back arrow + centered title (see `CreateEventoScreen.tsx`, `EditProfileScreen.tsx`), `extractErrorMessage` for error text, `isLoading` state driving `Button`'s `loading` prop, `TextField`/`Button`/`Card`/`SectionHeader` from `src/components`.
- No new npm dependencies in either repo.

---

### Task 1: Backend — pending invites endpoint

**Files:**
- Modify: `igreja-app-backend/src/dtos/grupoFamiliar.dto.ts`
- Modify: `igreja-app-backend/src/repository/grupoFamiliar.repository.ts`
- Modify: `igreja-app-backend/src/services/grupoFamiliar.services.ts`
- Modify: `igreja-app-backend/src/controllers/grupoFamiliar.controller.ts`
- Modify: `igreja-app-backend/src/routes/grupoFamiliar.routes.ts`

**Interfaces:**
- Produces: `GET /api/familias/convites/pendentes` (authenticated) → `{ success: true, data: ConviteFamiliaPendenteResponse[] }`, consumed by `groupsService.listPendingInvites()` in Task 2.

- [ ] **Step 1: Add the response DTO**

Open `igreja-app-backend/src/dtos/grupoFamiliar.dto.ts`. Add at the end of the file:

```ts
export interface ConviteFamiliaPendenteResponse {
    id: number;
    grupoId: number;
    nomeGrupo: string | null;
    parentesco: string | null;
    convidadoPor: { id: number; nomeCompleto: string };
}
```

- [ ] **Step 2: Add the repository method**

Open `igreja-app-backend/src/repository/grupoFamiliar.repository.ts`. Add this method right after `atualizarStatusConvite` (before `contarPorUsuario`):

```ts
    async buscarConvitesPendentes(usuarioId: number) {
        return prisma.membroFamilia.findMany({
            where: { usuarioId, status: 'pendente' },
            include: {
                grupoFamiliar: { select: { id: true, nome: true } },
                convidadoPor: { select: { id: true, nomeCompleto: true } },
            },
        });
    }
```

- [ ] **Step 3: Add the service method**

Open `igreja-app-backend/src/services/grupoFamiliar.services.ts`. Add `ConviteFamiliaPendenteResponse` to the type-only import at the top of the file:

```ts
import type {
  CreateGrupoFamiliarDTO,
  ConvidarMembroDTO,
  ResponderConviteDTO,
  GrupoFamiliarResponse,
  GrupoFamiliarComMembros,
  MembroFamiliaResponse,
  ConviteFamiliaPendenteResponse,
} from "../dtos/grupoFamiliar.dto";
```

Add this method right after `getByUsuario` (before `removerMembro`):

```ts
  public async getConvitesPendentes(
    usuarioId: number,
  ): Promise<ConviteFamiliaPendenteResponse[]> {
    const convites =
      await this.grupoFamiliarRepository.buscarConvitesPendentes(usuarioId);

    return convites.map((convite) => ({
      id: convite.id,
      grupoId: convite.grupoFamiliarId,
      nomeGrupo: convite.grupoFamiliar?.nome ?? null,
      parentesco: convite.parentesco,
      convidadoPor: {
        id: convite.convidadoPor?.id ?? 0,
        nomeCompleto: convite.convidadoPor?.nomeCompleto ?? "",
      },
    }));
  }
```

- [ ] **Step 4: Add the controller method**

Open `igreja-app-backend/src/controllers/grupoFamiliar.controller.ts`. Add this method right after `getByUsuario` (before `removerMembro`):

```ts
  public getConvitesPendentes = async (
    req: AuthRequest,
    res: Response,
  ): Promise<void> => {
    const usuarioId = req.user!.id;

    const convites =
      await this.grupoFamiliarService.getConvitesPendentes(usuarioId);

    res.status(200).json({
      success: true,
      data: convites,
    });
  };
```

- [ ] **Step 5: Register the route before `/:grupoId`**

Open `igreja-app-backend/src/routes/grupoFamiliar.routes.ts`. Insert the new route between the existing `patch('/convites/:membroId/responder', ...)` line and the `get('/:grupoId', ...)` line:

```ts
router.get('/convites/pendentes', authMiddleware.authenticate, grupoFamiliarController.getConvitesPendentes);
```

The file's route order must end up as: `POST /`, `POST /:grupoId/convidar`, `PATCH /convites/:membroId/responder`, `GET /convites/pendentes`, `GET /:grupoId`, `GET /usuario/:usuarioId`, `DELETE /:grupoId/membros/:usuarioId`.

- [ ] **Step 6: Type-check the backend**

Run: `cd "C:\Users\mathe\OneDrive\Área de Trabalho\igreja\igreja-app-backend" && npx tsc --noEmit --project tsconfig.json`
Expected: no errors.

- [ ] **Step 7: Do not commit — leave the change in the working tree.**

---

### Task 2: Frontend — rewrite `groups.service.ts`

**Files:**
- Modify: `igreja-app-front/src/services/groups.service.ts`

**Interfaces:**
- Consumes: existing `api` from `./api`.
- Produces: types `MembroFamilia`, `GrupoFamiliar`, `ConvitePendente`; functions `getCriadorNome(grupo: GrupoFamiliar): string | null`, `countMembrosAtivos(grupo: GrupoFamiliar): number`; `groupsService.getUserGroups(usuarioId): Promise<GrupoFamiliar[]>`, `groupsService.getGroupDetail(grupoId): Promise<GrupoFamiliar>`, `groupsService.respondInvite(membroId, status): Promise<void>` (unchanged behavior), `groupsService.listPendingInvites(): Promise<ConvitePendente[]>`, `groupsService.createGroup(nome?): Promise<GrupoFamiliar>`, `groupsService.inviteMember(grupoId, usuarioId, parentesco?): Promise<void>`. All consumed by Tasks 4–8.

- [ ] **Step 1: Replace the full file content**

Replace the entire content of `igreja-app-front/src/services/groups.service.ts` with:

```ts
import { api } from './api';

export type MembroFamilia = {
  id: number; // id do membroFamilia — usado no PATCH /familias/convites/:membroId/responder
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

export function getCriadorNome(grupo: GrupoFamiliar): string | null {
  const criador = grupo.membros.find((m) => m.parentesco === 'Criador');
  return criador?.usuario.nomeCompleto ?? null;
}

export function countMembrosAtivos(grupo: GrupoFamiliar): number {
  return grupo.membros.filter((m) => m.status === 'aceito').length;
}

export const groupsService = {
  async getUserGroups(usuarioId: number): Promise<GrupoFamiliar[]> {
    const { data } = await api.get(`/api/familias/usuario/${usuarioId}`);
    return (data.data ?? []) as GrupoFamiliar[];
  },

  async getGroupDetail(grupoId: string | number): Promise<GrupoFamiliar> {
    const { data } = await api.get(`/api/familias/${grupoId}`);
    return data.data as GrupoFamiliar;
  },

  async respondInvite(membroId: number, status: 'aceito' | 'recusado'): Promise<void> {
    await api.patch(`/api/familias/convites/${membroId}/responder`, { status });
  },

  async listPendingInvites(): Promise<ConvitePendente[]> {
    const { data } = await api.get('/api/familias/convites/pendentes');
    return (data.data ?? []) as ConvitePendente[];
  },

  async createGroup(nome?: string): Promise<GrupoFamiliar> {
    const { data } = await api.post('/api/familias', nome ? { nome } : {});
    return data.data as GrupoFamiliar;
  },

  async inviteMember(
    grupoId: number,
    usuarioId: number,
    parentesco?: string,
  ): Promise<void> {
    await api.post(`/api/familias/${grupoId}/convidar`, {
      usuarioId,
      ...(parentesco ? { parentesco } : {}),
    });
  },
};
```

- [ ] **Step 2: Do not commit — leave the change in the working tree.**

Note: this step intentionally breaks `ProfileScreen.tsx`, `GroupsScreen.tsx`, and `GroupDetailScreen.tsx` (they still reference the old `GrupoResumo`/`GrupoDetalhe`/`MembroDetalhe` types). That's expected — Tasks 6–8 fix them. Don't run `tsc` as a pass/fail gate until Task 8 is done; it will show errors in those three files until then, which is fine.

---

### Task 3: Frontend — `usersService.search`

**Files:**
- Modify: `igreja-app-front/src/services/users.service.ts`

**Interfaces:**
- Produces: type `UsuarioResumo`, `usersService.search(busca, page?, limit?): Promise<UsuarioResumo[]>`, consumed by `InviteMemberScreen` in Task 5.

- [ ] **Step 1: Add the type and method**

Open `igreja-app-front/src/services/users.service.ts`. Add the type after `AniversarianteDia`:

```ts
export type UsuarioResumo = {
  id: number;
  nomeCompleto: string;
  fotoUrl: string | null;
  perfil: string;
};
```

Add the method inside the `usersService` object, after `fetchAniversariantes`:

```ts
  async search(busca: string, page = 1, limit = 20): Promise<UsuarioResumo[]> {
    const { data } = await api.get('/api/usuarios', { params: { busca, page, limit } });
    return (data.data ?? []) as UsuarioResumo[];
  },
```

- [ ] **Step 2: Type-check**

Run: `cd "C:\Users\mathe\OneDrive\Área de Trabalho\igreja\igreja-app-front" && npx tsc --noEmit`
Expected: errors only in `ProfileScreen.tsx`, `GroupsScreen.tsx`, `GroupDetailScreen.tsx` (not yet fixed — see Task 2 note). No errors in `users.service.ts`.

- [ ] **Step 3: Do not commit — leave the change in the working tree.**

---

### Task 4: Frontend — `CreateGroupScreen` + route

**Files:**
- Create: `igreja-app-front/src/screens/grupos/CreateGroupScreen.tsx`
- Modify: `igreja-app-front/src/navigation/types.ts`
- Modify: `igreja-app-front/src/navigation/AppStack.tsx`

**Interfaces:**
- Consumes: `groupsService.createGroup(nome?): Promise<GrupoFamiliar>` from Task 2; `extractErrorMessage` from `services/api`; `Button`, `TextField` from `components`.
- Produces: `CreateGroupScreen` component and the `CreateGroup: undefined` route, consumed by Task 7 (`GroupsScreen`'s navigate call).

- [ ] **Step 1: Add both new routes to `AppStackParamList`**

Open `igreja-app-front/src/navigation/types.ts`. Add to `AppStackParamList`, after `GroupDetail: { id: string };`:

```ts
  CreateGroup: undefined;
  InviteMember: { grupoId: number; grupoNome: string };
```

(Adding both routes now, in one edit, avoids touching this small file twice — `InviteMember` is used starting in Task 5.)

- [ ] **Step 2: Create `CreateGroupScreen.tsx`**

Create `igreja-app-front/src/screens/grupos/CreateGroupScreen.tsx` with this exact content:

```tsx
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, TextField } from '../../components';
import { colors } from '../../constants/theme';
import type { AppStackParamList } from '../../navigation/types';
import { extractErrorMessage } from '../../services/api';
import { groupsService } from '../../services/groups.service';

type Props = NativeStackScreenProps<AppStackParamList, 'CreateGroup'>;

export function CreateGroupScreen({ navigation }: Props) {
  const [nome, setNome] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setIsLoading(true);
    try {
      const grupo = await groupsService.createGroup(nome.trim() || undefined);
      navigation.replace('GroupDetail', { id: String(grupo.id) });
    } catch (e) {
      setError(extractErrorMessage(e, 'Não foi possível criar o grupo.'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center justify-between border-b border-outline-variant px-gutter py-3">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </Pressable>
        <Text className="font-serif-bold text-base text-primary">Criar Grupo Familiar</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        className="flex-1 px-gutter"
        contentContainerClassName="gap-4 py-lg"
        keyboardShouldPersistTaps="handled"
      >
        <TextField
          label="Nome do grupo (opcional)"
          placeholder="Ex: Família Silva"
          value={nome}
          onChangeText={(v) => { setNome(v); setError(null); }}
        />

        {error && <Text className="text-center font-sans text-sm text-error">{error}</Text>}

        <Button label="Criar grupo" loading={isLoading} onPress={handleSubmit} />
      </ScrollView>
    </SafeAreaView>
  );
}
```

- [ ] **Step 3: Register the screen in `AppStack.tsx`**

Open `igreja-app-front/src/navigation/AppStack.tsx`. Add the import after the `EditProfileScreen` import:

```ts
import { CreateGroupScreen } from '../screens/grupos/CreateGroupScreen';
```

Add the `<Stack.Screen>` entry right after `<Stack.Screen name="GroupDetail" component={GroupDetailScreen} />`:

```tsx
      <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
```

- [ ] **Step 4: Type-check**

Run: `cd "C:\Users\mathe\OneDrive\Área de Trabalho\igreja\igreja-app-front" && npx tsc --noEmit`
Expected: no new errors from `CreateGroupScreen.tsx`, `types.ts`, or `AppStack.tsx`. (`ProfileScreen.tsx`/`GroupsScreen.tsx`/`GroupDetailScreen.tsx` still show pre-existing errors from Task 2 — expected until Task 8.)

- [ ] **Step 5: Do not commit — leave the change in the working tree.**

---

### Task 5: Frontend — `InviteMemberScreen` + route registration

**Files:**
- Create: `igreja-app-front/src/screens/grupos/InviteMemberScreen.tsx`
- Modify: `igreja-app-front/src/navigation/AppStack.tsx`

**Interfaces:**
- Consumes: `usersService.search(busca): Promise<UsuarioResumo[]>` from Task 3; `groupsService.inviteMember(grupoId, usuarioId, parentesco?): Promise<void>` from Task 2; `extractErrorMessage`; `Button`, `Card`, `TextField` from `components`; route param type `InviteMember: { grupoId: number; grupoNome: string }` from Task 4.
- Produces: `InviteMemberScreen` component and its registration, consumed by Task 6 (`GroupDetailScreen`'s navigate call).

- [ ] **Step 1: Create `InviteMemberScreen.tsx`**

Create `igreja-app-front/src/screens/grupos/InviteMemberScreen.tsx` with this exact content:

```tsx
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, TextField } from '../../components';
import { colors } from '../../constants/theme';
import type { AppStackParamList } from '../../navigation/types';
import { extractErrorMessage } from '../../services/api';
import { groupsService } from '../../services/groups.service';
import { usersService, type UsuarioResumo } from '../../services/users.service';

type Props = NativeStackScreenProps<AppStackParamList, 'InviteMember'>;

export function InviteMemberScreen({ route, navigation }: Props) {
  const { grupoId, grupoNome } = route.params;

  const [busca, setBusca] = useState('');
  const [resultados, setResultados] = useState<UsuarioResumo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [selecionado, setSelecionado] = useState<UsuarioResumo | null>(null);
  const [parentesco, setParentesco] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSearch() {
    if (!busca.trim()) return;
    setIsSearching(true);
    setSearchError(null);
    try {
      const data = await usersService.search(busca.trim());
      setResultados(data);
    } catch (e) {
      setSearchError(extractErrorMessage(e));
    } finally {
      setIsSearching(false);
    }
  }

  function handleSelect(usuario: UsuarioResumo) {
    setSelecionado(usuario);
    setInviteError(null);
    setSuccess(false);
  }

  async function handleInvite() {
    if (!selecionado) return;
    setInviteError(null);
    setIsInviting(true);
    try {
      await groupsService.inviteMember(grupoId, selecionado.id, parentesco.trim() || undefined);
      setSuccess(true);
      setSelecionado(null);
      setParentesco('');
    } catch (e) {
      setInviteError(extractErrorMessage(e));
    } finally {
      setIsInviting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center justify-between border-b border-outline-variant px-gutter py-3">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </Pressable>
        <Text className="font-serif-bold text-base text-primary">Convidar Membro</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        className="flex-1 px-gutter"
        contentContainerClassName="gap-4 py-lg"
        keyboardShouldPersistTaps="handled"
      >
        <Text className="font-sans text-sm text-ink-muted">
          Convidando para {grupoNome || 'o grupo'}
        </Text>

        <View className="flex-row items-end gap-2">
          <View className="flex-1">
            <TextField
              label="Buscar por nome"
              placeholder="Ex: Maria"
              value={busca}
              onChangeText={setBusca}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>
          <Button label="Buscar" fullWidth={false} loading={isSearching} onPress={handleSearch} />
        </View>

        {searchError && (
          <Text className="text-center font-sans text-sm text-error">{searchError}</Text>
        )}

        {success && (
          <Text className="text-center font-sans text-sm text-success">
            Convite enviado com sucesso!
          </Text>
        )}

        {resultados.length > 0 ? (
          <View className="gap-2">
            {resultados.map((usuario) => (
              <Pressable key={usuario.id} onPress={() => handleSelect(usuario)}>
                <Card contentClassName="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <View className="h-11 w-11 items-center justify-center rounded-full bg-surface-container-high">
                      <Text className="font-sans-semibold text-ink">
                        {usuario.nomeCompleto.trim().charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text className="font-sans-semibold text-sm text-ink">
                        {usuario.nomeCompleto}
                      </Text>
                      <Text className="font-sans text-xs text-ink-muted">{usuario.perfil}</Text>
                    </View>
                  </View>
                  {selecionado?.id === usuario.id ? (
                    <Ionicons name="checkmark-circle" size={20} color={colors.gold} />
                  ) : null}
                </Card>
              </Pressable>
            ))}
          </View>
        ) : !isSearching && busca.trim() ? (
          <Text className="py-2 text-center font-sans text-sm text-ink-muted">
            Nenhum membro encontrado.
          </Text>
        ) : null}

        {selecionado ? (
          <View className="gap-4">
            <TextField
              label="Parentesco (opcional)"
              placeholder="Ex: Filho, Cônjuge"
              value={parentesco}
              onChangeText={setParentesco}
            />

            {inviteError && (
              <Text className="text-center font-sans text-sm text-error">{inviteError}</Text>
            )}

            <Button label="Enviar convite" loading={isInviting} onPress={handleInvite} />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Register the screen in `AppStack.tsx`**

Open `igreja-app-front/src/navigation/AppStack.tsx`. Add the import after the `CreateGroupScreen` import added in Task 4:

```ts
import { InviteMemberScreen } from '../screens/grupos/InviteMemberScreen';
```

Add the `<Stack.Screen>` entry right after `<Stack.Screen name="CreateGroup" component={CreateGroupScreen} />`:

```tsx
      <Stack.Screen name="InviteMember" component={InviteMemberScreen} />
```

- [ ] **Step 3: Type-check**

Run: `cd "C:\Users\mathe\OneDrive\Área de Trabalho\igreja\igreja-app-front" && npx tsc --noEmit`
Expected: no new errors from `InviteMemberScreen.tsx` or `AppStack.tsx`. (Pre-existing errors in `ProfileScreen.tsx`/`GroupsScreen.tsx`/`GroupDetailScreen.tsx` still expected until Task 8.)

- [ ] **Step 4: Do not commit — leave the change in the working tree.**

---

### Task 6: Frontend — fix `GroupDetailScreen.tsx`

**Files:**
- Modify: `igreja-app-front/src/screens/grupos/GroupDetailScreen.tsx`

**Interfaces:**
- Consumes: `GrupoFamiliar`, `countMembrosAtivos` from Task 2; `InviteMember` route from Task 5.

- [ ] **Step 1: Replace the full file content**

Replace the entire content of `igreja-app-front/src/screens/grupos/GroupDetailScreen.tsx` with:

```tsx
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../components';
import { colors } from '../../constants/theme';
import type { AppStackParamList } from '../../navigation/types';
import { groupsService, countMembrosAtivos, type GrupoFamiliar } from '../../services/groups.service';
import { extractErrorMessage } from '../../services/api';

type Props = NativeStackScreenProps<AppStackParamList, 'GroupDetail'>;

export function GroupDetailScreen({ route, navigation }: Props) {
  const [grupo, setGrupo] = useState<GrupoFamiliar | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await groupsService.getGroupDetail(route.params.id);
        setGrupo(data);
      } catch (e) {
        setError(extractErrorMessage(e));
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [route.params.id]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center justify-between border-b border-outline-variant px-gutter py-3">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </Pressable>
        <Text className="font-serif-bold text-base text-primary">Detalhes da Família</Text>
        {grupo ? (
          <Pressable
            onPress={() =>
              navigation.navigate('InviteMember', {
                grupoId: grupo.id,
                grupoNome: grupo.nome ?? '',
              })
            }
            hitSlop={8}
          >
            <Ionicons name="person-add-outline" size={20} color={colors.primary} />
          </Pressable>
        ) : (
          <View style={{ width: 20 }} />
        )}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.gold} />
        </View>
      ) : error || !grupo ? (
        <View className="flex-1 items-center justify-center gap-3 px-gutter">
          <Text className="text-center font-sans text-sm text-ink-muted">
            {error ?? 'Grupo não encontrado.'}
          </Text>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Text className="font-sans-semibold text-sm text-secondary">Voltar</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerClassName="gap-md px-gutter py-lg">
          <Card accent contentClassName="items-center gap-2">
            <View className="h-16 w-16 items-center justify-center rounded-lg bg-surface-container-high">
              <MaterialCommunityIcons name="family-tree" size={30} color={colors.gold} />
            </View>
            <Text className="text-center font-serif-bold text-xl text-ink">
              {grupo.nome ?? 'Grupo familiar'}
            </Text>
            <View className="mt-2 items-center">
              <Text className="font-sans text-xs text-ink-muted">Integrantes</Text>
              <Text className="font-serif-bold text-lg text-primary">
                {countMembrosAtivos(grupo)}
              </Text>
            </View>
          </Card>

          {grupo.membros.length > 0 ? (
            <View className="gap-2">
              <Text className="font-sans-semibold text-xs uppercase tracking-wide text-ink-muted">
                Integrantes
              </Text>
              {grupo.membros.map((membro) => (
                <Card key={membro.id} contentClassName="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <View className="h-11 w-11 items-center justify-center rounded-full bg-surface-container-high">
                      <Text className="font-sans-semibold text-ink">
                        {membro.usuario.nomeCompleto.trim().charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text className="font-sans-semibold text-sm text-ink">
                        {membro.usuario.nomeCompleto}
                      </Text>
                      <Text className="font-sans text-xs text-ink-muted">
                        {membro.parentesco ?? membro.usuario.perfil}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="ellipsis-vertical" size={16} color={colors.outline} />
                </Card>
              ))}
            </View>
          ) : (
            <Card contentClassName="items-center py-6">
              <Text className="font-sans text-sm text-ink-muted">
                Nenhum membro encontrado.
              </Text>
            </Card>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
```

Note: this replaces the old decorative `share-outline` icon with the new, functional
"convidar membro" (`person-add-outline`) action — the share icon had no `onPress` and did
nothing; dropping it keeps the header from getting crowded with a second icon.

- [ ] **Step 2: Do not commit — leave the change in the working tree.**

---

### Task 7: Frontend — fix `GroupsScreen.tsx`

**Files:**
- Modify: `igreja-app-front/src/screens/grupos/GroupsScreen.tsx`

**Interfaces:**
- Consumes: `GrupoFamiliar`, `ConvitePendente`, `getCriadorNome`, `countMembrosAtivos`, `groupsService.listPendingInvites` from Task 2; `CreateGroup` route from Task 4.

- [ ] **Step 1: Replace the full file content**

Replace the entire content of `igreja-app-front/src/screens/grupos/GroupsScreen.tsx` with:

```tsx
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, SectionHeader } from '../../components';
import { colors } from '../../constants/theme';
import { useAuth } from '../../navigation/AuthContext';
import type { AppStackParamList } from '../../navigation/types';
import {
  groupsService,
  getCriadorNome,
  countMembrosAtivos,
  type GrupoFamiliar,
  type ConvitePendente,
} from '../../services/groups.service';
import { extractErrorMessage } from '../../services/api';

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initial = name.trim().charAt(0).toUpperCase();
  return (
    <View
      className="items-center justify-center rounded-full bg-surface-container-high"
      style={{ width: size, height: size }}
    >
      <Text className="font-sans-semibold text-ink" style={{ fontSize: size * 0.4 }}>
        {initial}
      </Text>
    </View>
  );
}

export function GroupsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { user } = useAuth();

  const [grupos, setGrupos] = useState<GrupoFamiliar[]>([]);
  const [convitesPendentes, setConvitesPendentes] = useState<ConvitePendente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [respondingId, setRespondingId] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    load();
  }, [user?.id]);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const [gruposResult, convitesResult] = await Promise.allSettled([
        groupsService.getUserGroups(user!.id),
        groupsService.listPendingInvites(),
      ]);
      if (gruposResult.status === 'fulfilled') {
        setGrupos(gruposResult.value);
      } else {
        setError(extractErrorMessage(gruposResult.reason));
      }
      if (convitesResult.status === 'fulfilled') {
        setConvitesPendentes(convitesResult.value);
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRespond(membroId: number, status: 'aceito' | 'recusado') {
    setRespondingId(membroId);
    try {
      await groupsService.respondInvite(membroId, status);
      await load();
    } catch {
      // keep UI consistent if request fails
    } finally {
      setRespondingId(null);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView className="flex-1 px-gutter" contentContainerClassName="gap-md py-lg">
        <SectionHeader
          eyebrow="Comunhão"
          title="Grupos Familiares"
          subtitle="Encontre o seu lugar de comunhão e crescimento espiritual. Nossos grupos se reúnem semanalmente para compartilhar a vida e a Palavra."
          actionLabel="Criar grupo"
          onActionPress={() => navigation.navigate('CreateGroup')}
        />

        {isLoading ? (
          <ActivityIndicator size="large" color={colors.gold} style={{ marginTop: 32 }} />
        ) : error ? (
          <View className="items-center gap-3 py-8">
            <Text className="text-center font-sans text-sm text-ink-muted">{error}</Text>
            <Button label="Tentar novamente" variant="secondary" onPress={load} />
          </View>
        ) : (
          <>
            {/* Meus grupos */}
            {grupos.length > 0 ? (
              <View className="gap-3">
                {grupos.map((grupo) => {
                  const criadorNome = getCriadorNome(grupo);
                  return (
                    <Card key={grupo.id} accent contentClassName="gap-3">
                      <Text className="font-sans-semibold text-xs uppercase tracking-wide text-secondary">
                        Sua família
                      </Text>
                      <Text className="font-serif-bold text-xl text-ink">
                        {grupo.nome ?? 'Grupo familiar'}
                      </Text>

                      {criadorNome ? (
                        <View className="flex-row items-center gap-3">
                          <Avatar name={criadorNome} size={40} />
                          <View>
                            <Text className="font-sans-semibold text-sm text-ink">
                              Criado por {criadorNome}
                            </Text>
                            <Text className="font-sans text-xs text-ink-muted">
                              {countMembrosAtivos(grupo)} membros participando
                            </Text>
                          </View>
                        </View>
                      ) : (
                        <Text className="font-sans text-xs text-ink-muted">
                          {countMembrosAtivos(grupo)} membros participando
                        </Text>
                      )}

                      <Button
                        label="Ver membros da família"
                        variant="secondary"
                        onPress={() =>
                          navigation.navigate('GroupDetail', { id: String(grupo.id) })
                        }
                      />
                    </Card>
                  );
                })}
              </View>
            ) : (
              <Card contentClassName="items-center gap-3 py-6">
                <Ionicons name="people-outline" size={36} color={colors.outline} />
                <Text className="text-center font-sans-semibold text-base text-ink">
                  Você ainda não faz parte de nenhum grupo familiar
                </Text>
                <Text className="text-center font-sans text-sm text-ink-muted">
                  Peça ao líder do grupo para te convidar, ou crie o seu.
                </Text>
              </Card>
            )}

            {/* Convites pendentes */}
            {convitesPendentes.length > 0 ? (
              <View className="gap-2">
                <View className="flex-row items-center gap-2">
                  <Ionicons name="mail-outline" size={18} color={colors.primary} />
                  <Text className="font-serif-bold text-lg text-ink">Convites</Text>
                  <View className="h-5 min-w-5 items-center justify-center rounded-full bg-error px-1.5">
                    <Text className="font-sans-semibold text-xs text-on-error">
                      {convitesPendentes.length}
                    </Text>
                  </View>
                </View>
                {convitesPendentes.map((convite) => (
                  <Card key={convite.id} contentClassName="gap-2">
                    <Text className="font-sans text-sm text-ink">
                      Convite para{' '}
                      <Text className="font-sans-semibold">
                        {convite.nomeGrupo ?? 'um grupo familiar'}
                      </Text>
                    </Text>
                    <Text className="font-sans text-xs text-ink-muted">
                      Convidado por {convite.convidadoPor.nomeCompleto}
                    </Text>
                    <View className="flex-row gap-2">
                      <View className="flex-1">
                        <Button
                          label="Aceitar"
                          loading={respondingId === convite.id}
                          onPress={() => handleRespond(convite.id, 'aceito')}
                        />
                      </View>
                      <View className="flex-1">
                        <Button
                          label="Recusar"
                          variant="secondary"
                          loading={respondingId === convite.id}
                          onPress={() => handleRespond(convite.id, 'recusado')}
                        />
                      </View>
                    </View>
                  </Card>
                ))}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Do not commit — leave the change in the working tree.**

---

### Task 8: Frontend — fix `ProfileScreen.tsx`

**Files:**
- Modify: `igreja-app-front/src/screens/perfil/ProfileScreen.tsx`

**Interfaces:**
- Consumes: `GrupoFamiliar`, `getCriadorNome` from Task 2.

- [ ] **Step 1: Fix the import**

In `igreja-app-front/src/screens/perfil/ProfileScreen.tsx`, change:

```ts
import { groupsService, type GrupoResumo } from '../../services/groups.service';
```

to:

```ts
import { groupsService, getCriadorNome, type GrupoFamiliar } from '../../services/groups.service';
```

- [ ] **Step 2: Fix the state type**

Change:

```ts
  const [meusGrupos, setMeusGrupos] = useState<GrupoResumo[]>([]);
```

to:

```ts
  const [meusGrupos, setMeusGrupos] = useState<GrupoFamiliar[]>([]);
```

- [ ] **Step 3: Remove the now-invalid `acceptedGroups` filter**

Change:

```ts
  const activeMatricula = historico.find((m) => m.status === 'ativa');
  const completedMatriculas = historico.filter((m) => m.status === 'concluido');
  const acceptedGroups = meusGrupos.filter((g) => g.status === 'aceito');
```

to:

```ts
  const activeMatricula = historico.find((m) => m.status === 'ativa');
  const completedMatriculas = historico.filter((m) => m.status === 'concluido');
```

(`groupsService.getUserGroups` already only returns accepted groups — the backend query
filters `status: 'aceito'` — so there's nothing left to filter client-side.)

- [ ] **Step 4: Fix the "Aba: Família" rendering**

Change:

```tsx
        {activeTab === 'familia' ? (
          isLoadingTabs ? (
            <ActivityIndicator color={colors.gold} />
          ) : acceptedGroups.length > 0 ? (
            <View className="gap-3">
              {acceptedGroups.map((grupo) => (
                <Pressable
                  key={grupo.grupoId}
                  onPress={() =>
                    navigation.navigate('GroupDetail', { id: String(grupo.grupoId) })
                  }
                >
                  <Card contentClassName="flex-row items-center justify-between">
                    <View>
                      <Text className="font-sans-semibold text-xs uppercase tracking-wide text-ink-muted">
                        Grupo familiar
                      </Text>
                      <Text className="font-serif-bold text-lg text-ink">{grupo.nome}</Text>
                      <Text className="font-sans text-xs text-ink-muted">
                        Líder: {grupo.liderNome}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.outline} />
                  </Card>
                </Pressable>
              ))}
            </View>
          ) : (
```

to:

```tsx
        {activeTab === 'familia' ? (
          isLoadingTabs ? (
            <ActivityIndicator color={colors.gold} />
          ) : meusGrupos.length > 0 ? (
            <View className="gap-3">
              {meusGrupos.map((grupo) => {
                const criadorNome = getCriadorNome(grupo);
                return (
                  <Pressable
                    key={grupo.id}
                    onPress={() =>
                      navigation.navigate('GroupDetail', { id: String(grupo.id) })
                    }
                  >
                    <Card contentClassName="flex-row items-center justify-between">
                      <View>
                        <Text className="font-sans-semibold text-xs uppercase tracking-wide text-ink-muted">
                          Grupo familiar
                        </Text>
                        <Text className="font-serif-bold text-lg text-ink">
                          {grupo.nome ?? 'Grupo familiar'}
                        </Text>
                        {criadorNome ? (
                          <Text className="font-sans text-xs text-ink-muted">
                            Criado por {criadorNome}
                          </Text>
                        ) : null}
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={colors.outline} />
                    </Card>
                  </Pressable>
                );
              })}
            </View>
          ) : (
```

- [ ] **Step 5: Type-check**

Run: `cd "C:\Users\mathe\OneDrive\Área de Trabalho\igreja\igreja-app-front" && npx tsc --noEmit`
Expected: no errors anywhere in the project. This is the first point in the plan where the
full frontend type-checks clean again.

- [ ] **Step 6: Do not commit — leave the change in the working tree.**

---

### Task 9: Manual end-to-end verification

**Files:** none (verification only).

- [ ] **Step 1: Confirm both servers are reachable**

Backend running (`npm run dev` in `igreja-app-backend`, so the Task 1 route changes are
picked up by nodemon), and `igreja-app-front/src/config.ts`'s `API_BASE_URL` pointing at
that machine's current IP.

- [ ] **Step 2: Run the app**

Run: `cd "C:\Users\mathe\OneDrive\Área de Trabalho\igreja\igreja-app-front" && npx expo start`
Open in Expo Go / dev client, log in.

- [ ] **Step 3: Exercise "criar grupo"**

1. Go to the **Grupos** tab. Confirm the "Criar grupo" link is visible in the header
   regardless of whether you already have a group.
2. Tap it → `CreateGroupScreen` opens. Leave the name blank, tap **Criar grupo**.
3. Expected: navigates straight to `GroupDetailScreen` for the new group, showing you as
   the only member with parentesco "Criador", and "Integrantes: 1".
4. Go back to **Grupos** — the new group should appear under "Sua família" with "Criado por
   {seu nome}".

- [ ] **Step 4: Exercise "convidar membro"**

1. From the new group's `GroupDetailScreen`, tap the person-add icon in the header →
   `InviteMemberScreen` opens.
2. Search for another real user's name (a second test account), tap **Buscar**.
3. Tap a result to select it, optionally fill "Parentesco", tap **Enviar convite**.
4. Expected: "Convite enviado com sucesso!" message, selection clears.
5. Try selecting yourself in the search results (if you appear) and inviting — expected:
   inline error from the backend ("Você não pode convidar a si mesmo para o grupo.").
6. Try inviting the same user twice — expected: inline error ("Este usuário já foi
   convidado ou já faz parte do grupo.").

- [ ] **Step 5: Exercise "convites pendentes" from the invited account**

1. Log in as the second test account that was just invited.
2. Go to **Grupos** — the "Convites" section should now show the pending invite with the
   correct group name and inviter name (this is the endpoint built in Task 1 — if this
   section stays empty, the bug is either in the new backend route or in
   `listPendingInvites()`).
3. Tap **Aceitar** — expected: the invite disappears from "Convites" and the group appears
   under "Sua família" for this account too.

- [ ] **Step 6: Report results**

No commit for this task. If any step fails, identify which task's files are responsible,
fix the root cause there, re-run the relevant `tsc --noEmit`, and re-test before moving on.
