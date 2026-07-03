# Editar Perfil ("Configurações da conta") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the dead "Configurações da conta" button in `ProfileScreen` open a real edit-profile screen that saves changes to the backend via `PATCH /api/auth/me`.

**Architecture:** One new screen (`EditProfileScreen`) reads the current user from `AuthContext`, edits a local form, and on submit calls a new `authService.updateMe()` through a new `AuthContext.updateUser()` that refreshes the in-memory user. Registered as a new stack route (`EditProfile`) in the existing `AppStack`.

**Tech Stack:** React Native (Expo SDK 54), TypeScript, React Navigation native-stack, axios (via `src/services/api.ts`), NativeWind/Tailwind for styling. Existing design-system components: `Button`, `Chip`, `TextField` from `src/components`.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-03-edit-profile-design.md`.
- Editable fields only: `nomeCompleto`, `sexo`, `dataNascimento`, `estadoCivil`, `profissao`, `exibirAniversario`. No photo, email, or password field.
- `dataNascimento` is sent to the API as `YYYY-MM-DD`; the form displays/accepts `DD/MM/AAAA` (same convention as `CreateEventoScreen`'s date field), converted at submit time.
- No new npm dependencies — no date-picker library exists in this project (`package.json` has none), and none should be added. Reuse the plain-`TextField` date pattern already used in `CreateEventoScreen`.
- Do not bump the Expo SDK version (pinned at 54 per `AGENTS.md` — SDK 55/56 not yet available in the public App Store Expo Go as of julho/2026).
- Follow existing screen conventions exactly: header row with back arrow + centered title (see `CreateEventoScreen.tsx`, `GroupDetailScreen.tsx`), `extractErrorMessage` for error text, `isLoading` state driving `Button`'s `loading` prop.
- **No automated test framework exists in this repo** (no jest/testing-library in `package.json`, no `test` script, zero test files under `src/`). Introducing one is out of scope for this feature. Verification instead uses `npx tsc --noEmit` (the project's only current automated safety net) after every task, plus a manual run-through against the real backend as the final task.

---

### Task 1: `authService.updateMe`

**Files:**
- Modify: `src/services/auth.service.ts`

**Interfaces:**
- Consumes: existing `api` from `./api`, existing `User` type in this file.
- Produces: `UpdateMePayload` type and `authService.updateMe(payload: UpdateMePayload): Promise<User>`, both used by Task 2.

- [ ] **Step 1: Add the `UpdateMePayload` type and `updateMe` method**

Open `src/services/auth.service.ts`. Add the new type right after the existing `RegisterPayload` type (after line 26, before `const TOKEN_KEY = 'auth_token';`):

```ts
export type UpdateMePayload = Partial<{
  nomeCompleto: string;
  sexo: 'Masculino' | 'Feminino';
  dataNascimento: string; // YYYY-MM-DD
  estadoCivil: string;
  profissao: string;
  exibirAniversario: boolean;
}>;
```

Then add a new method inside the `authService` object, right after `getMe`:

```ts
  async updateMe(payload: UpdateMePayload): Promise<User> {
    const { data } = await api.patch('/api/auth/me', payload);
    return data.data as User;
  },
```

The full `authService` object's method order should now be: `login`, `register`, `getMe`, `updateMe`, `logout`, `forgotPassword`, `resetPassword`, `getStoredToken`.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors (exit code 0, no output).

- [ ] **Step 3: Commit**

```bash
git add src/services/auth.service.ts
git commit -m "feat: add authService.updateMe for PATCH /api/auth/me"
```

---

### Task 2: `AuthContext.updateUser`

**Files:**
- Modify: `src/navigation/AuthContext.tsx`

**Interfaces:**
- Consumes: `authService.updateMe(payload: UpdateMePayload): Promise<User>` from Task 1; existing `setUser` state setter already in this file.
- Produces: `updateUser: (payload: UpdateMePayload) => Promise<void>` on `AuthContextValue`, consumed by `EditProfileScreen` in Task 3 via `useAuth()`.

- [ ] **Step 1: Import `UpdateMePayload` and extend `AuthContextValue`**

Open `src/navigation/AuthContext.tsx`. Change the import on line 2 from:

```ts
import { authService, type RegisterPayload, type User } from '../services/auth.service';
```

to:

```ts
import { authService, type RegisterPayload, type UpdateMePayload, type User } from '../services/auth.service';
```

Add `updateUser` to the `AuthContextValue` type (after `signUp`, before `signOut`):

```ts
  updateUser: (payload: UpdateMePayload) => Promise<void>;
```

- [ ] **Step 2: Implement `updateUser` in the provider**

Inside the `useMemo` that builds `value`, add `updateUser` after `signUp` and before `signOut`:

```ts
      updateUser: async (payload) => {
        const updated = await authService.updateMe(payload);
        setUser(updated);
      },
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/navigation/AuthContext.tsx
git commit -m "feat: add AuthContext.updateUser to refresh user after profile edits"
```

---

### Task 3: `EditProfileScreen` + route registration

**Files:**
- Create: `src/screens/perfil/EditProfileScreen.tsx`
- Modify: `src/navigation/types.ts`
- Modify: `src/navigation/AppStack.tsx`

**Interfaces:**
- Consumes: `useAuth()` → `{ user, updateUser }` from Task 2; `UpdateMePayload` type from Task 1; `extractErrorMessage` from `src/services/api.ts`; `Button`, `Chip`, `TextField` from `src/components`.
- Produces: `EditProfileScreen` component and the `EditProfile: undefined` route, consumed by Task 4 (`ProfileScreen`'s navigate call).

- [ ] **Step 1: Add the route to `AppStackParamList`**

Open `src/navigation/types.ts`. Add `EditProfile: undefined;` to `AppStackParamList`, after `MainTabs: undefined;`:

```ts
export type AppStackParamList = {
  MainTabs: undefined;
  EditProfile: undefined;
  Devocionais: undefined;
  DevocionalDetail: { id: string };
  Eventos: undefined;
  CursoDetail: { id: string };
  GroupDetail: { id: string };
  CreateConteudo: { tipo?: 'Devocional' | 'Estudo' | 'Aviso' } | undefined;
  CreateEvento: undefined;
  CreateSala: { cursoId: string; cursoTitulo: string };
  SalaParticipantes: { salaId: number; cursoTitulo: string };
};
```

- [ ] **Step 2: Create `EditProfileScreen.tsx`**

Create `src/screens/perfil/EditProfileScreen.tsx` with this exact content:

```tsx
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Chip, TextField } from '../../components';
import { colors } from '../../constants/theme';
import { useAuth } from '../../navigation/AuthContext';
import type { AppStackParamList } from '../../navigation/types';
import { extractErrorMessage } from '../../services/api';
import type { UpdateMePayload } from '../../services/auth.service';

type Props = NativeStackScreenProps<AppStackParamList, 'EditProfile'>;

function isoToDisplayDate(iso: string | null): string {
  if (!iso) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return '';
  const [, y, m, d] = match;
  return `${d}/${m}/${y}`;
}

function displayDateToISO(display: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(display.trim());
  if (!match) return null;
  const [, d, m, y] = match;
  const date = new Date(`${y}-${m}-${d}T00:00:00`);
  if (isNaN(date.getTime())) return null;
  return `${y}-${m}-${d}`;
}

export function EditProfileScreen({ navigation }: Props) {
  const { user, updateUser } = useAuth();

  const [nomeCompleto, setNomeCompleto] = useState(user?.nomeCompleto ?? '');
  const [sexo, setSexo] = useState<'Masculino' | 'Feminino' | null>(user?.sexo ?? null);
  const [dataNascimento, setDataNascimento] = useState(
    isoToDisplayDate(user?.dataNascimento ?? null),
  );
  const [estadoCivil, setEstadoCivil] = useState(user?.estadoCivil ?? '');
  const [profissao, setProfissao] = useState(user?.profissao ?? '');
  const [exibirAniversario, setExibirAniversario] = useState(user?.exibirAniversario ?? true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function canSubmit(): boolean {
    if (!nomeCompleto.trim()) return false;
    if (dataNascimento.trim() && !displayDateToISO(dataNascimento)) return false;
    return true;
  }

  async function handleSubmit() {
    setError(null);
    if (!nomeCompleto.trim()) {
      setError('Informe o nome completo.');
      return;
    }
    let dataNascimentoISO: string | undefined;
    if (dataNascimento.trim()) {
      const iso = displayDateToISO(dataNascimento);
      if (!iso) {
        setError('Data de nascimento inválida. Use DD/MM/AAAA.');
        return;
      }
      dataNascimentoISO = iso;
    }

    setIsLoading(true);
    try {
      const payload: UpdateMePayload = {
        nomeCompleto: nomeCompleto.trim(),
        ...(sexo ? { sexo } : {}),
        ...(dataNascimentoISO ? { dataNascimento: dataNascimentoISO } : {}),
        ...(estadoCivil.trim() ? { estadoCivil: estadoCivil.trim() } : {}),
        ...(profissao.trim() ? { profissao: profissao.trim() } : {}),
        exibirAniversario,
      };
      await updateUser(payload);
      navigation.goBack();
    } catch (e) {
      setError(extractErrorMessage(e, 'Não foi possível salvar as alterações.'));
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
        <Text className="font-serif-bold text-base text-primary">Configurações da conta</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        className="flex-1 px-gutter"
        contentContainerClassName="gap-4 py-lg"
        keyboardShouldPersistTaps="handled"
      >
        <TextField
          label="Nome completo *"
          placeholder="Ex: João da Silva"
          value={nomeCompleto}
          onChangeText={(v) => { setNomeCompleto(v); setError(null); }}
        />

        <View className="gap-1.5">
          <Text className="font-sans-medium text-xs text-ink-muted">Sexo</Text>
          <View className="flex-row gap-2">
            <Chip
              label="Masculino"
              active={sexo === 'Masculino'}
              onPress={() => setSexo('Masculino')}
            />
            <Chip
              label="Feminino"
              active={sexo === 'Feminino'}
              onPress={() => setSexo('Feminino')}
            />
          </View>
        </View>

        <TextField
          label="Data de nascimento"
          placeholder="DD/MM/AAAA"
          value={dataNascimento}
          onChangeText={(v) => { setDataNascimento(v); setError(null); }}
          keyboardType="numeric"
          maxLength={10}
        />

        <TextField
          label="Estado civil"
          placeholder="Ex: Casado(a)"
          value={estadoCivil}
          onChangeText={setEstadoCivil}
        />

        <TextField
          label="Profissão"
          placeholder="Ex: Professor(a)"
          value={profissao}
          onChangeText={setProfissao}
        />

        <Pressable
          className="flex-row items-center justify-between py-2"
          onPress={() => setExibirAniversario((v) => !v)}
        >
          <Text className="font-sans text-sm text-ink">Exibir aniversário para a igreja</Text>
          <Ionicons
            name={exibirAniversario ? 'toggle' : 'toggle-outline'}
            size={26}
            color={exibirAniversario ? colors.gold : colors.outline}
          />
        </Pressable>

        {error && <Text className="text-center font-sans text-sm text-error">{error}</Text>}

        <Button
          label="Salvar alterações"
          loading={isLoading}
          disabled={!canSubmit()}
          onPress={handleSubmit}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
```

- [ ] **Step 3: Register the screen in `AppStack.tsx`**

Open `src/navigation/AppStack.tsx`. Add the import after the `CourseDetailScreen` import (keep alphabetical grouping consistent with the existing style):

```ts
import { EditProfileScreen } from '../screens/perfil/EditProfileScreen';
```

Add the `<Stack.Screen>` entry right after `<Stack.Screen name="MainTabs" component={MainTabs} />`:

```tsx
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/screens/perfil/EditProfileScreen.tsx src/navigation/types.ts src/navigation/AppStack.tsx
git commit -m "feat: add EditProfileScreen and register EditProfile route"
```

---

### Task 4: Wire up "Configurações da conta"

**Files:**
- Modify: `src/screens/perfil/ProfileScreen.tsx`

**Interfaces:**
- Consumes: `EditProfile` route from Task 3, existing `navigation` object already constructed in this file (`useNavigation<NativeStackNavigationProp<AppStackParamList>>()`).

- [ ] **Step 1: Add `onPress` to the settings row**

Open `src/screens/perfil/ProfileScreen.tsx`. Find the "Configurações da conta" `Pressable` (currently no `onPress`):

```tsx
            <Pressable className="flex-row items-center justify-between px-4 py-3">
              <View className="flex-row items-center gap-3">
                <Ionicons name="settings-outline" size={18} color={colors.secondary} />
                <Text className="font-sans text-sm text-ink">Configurações da conta</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.outline} />
            </Pressable>
```

Replace it with:

```tsx
            <Pressable
              className="flex-row items-center justify-between px-4 py-3"
              onPress={() => navigation.navigate('EditProfile')}
            >
              <View className="flex-row items-center gap-3">
                <Ionicons name="settings-outline" size={18} color={colors.secondary} />
                <Text className="font-sans text-sm text-ink">Configurações da conta</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.outline} />
            </Pressable>
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/screens/perfil/ProfileScreen.tsx
git commit -m "feat: open EditProfile from Configurações da conta"
```

---

### Task 5: Manual end-to-end verification

**Files:** none (verification only).

- [ ] **Step 1: Confirm the backend base URL is reachable**

Check `src/config.ts` — `API_BASE_URL` must point at a machine/port that is actually running the IBVI backend right now. If the user's local IP changed since this was last set, update it before testing.

- [ ] **Step 2: Run the app**

Run: `npx expo start`
Open the app in Expo Go (or the running dev client), log in with a real account.

- [ ] **Step 3: Exercise the flow**

1. Go to the **Perfil** tab.
2. Tap **Configurações da conta** → the new `EditProfileScreen` should open, pre-filled with the current name, sexo, data de nascimento (if set), estado civil, profissão, and the "exibir aniversário" toggle.
3. Change the name and profissão, toggle "exibir aniversário", tap **Salvar alterações**.
4. Expected: button shows loading, screen navigates back to Perfil, and the updated name is visible immediately in the Perfil header (proves `AuthContext.updateUser` refreshed state without needing a re-login).
5. Re-open **Configurações da conta** and confirm the new values are still there (proves the backend persisted the change, not just local state).
6. Test the error path: clear the name field entirely — **Salvar alterações** should be disabled. Type an invalid date like `31/02/2026` — submitting should show the inline error "Data de nascimento inválida. Use DD/MM/AAAA." without navigating away.

- [ ] **Step 4: Report results**

No commit for this task — if any step fails, fix the root cause in the relevant task's files, re-run `npx tsc --noEmit`, and re-test before moving on.
