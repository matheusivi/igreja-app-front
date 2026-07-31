# Cursos — Criar, Buscar e Corrigir Filtro Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a leader create a course from the app, fix the category filter's hidden-scroll discoverability problem, and add a client-side search by course name or creator name.

**Architecture:** One new backend-facing service method, one new screen mirroring the existing `EditCursoScreen` pattern (kept as a separate file, not merged), and a rewrite of `CoursesListScreen` to add search state and switch the category filter from a hidden-indicator horizontal scroll to a wrapping row.

**Tech Stack:** React Native (Expo SDK 54), TypeScript, React Navigation native-stack, axios, NativeWind (`igreja-app-front`). No backend changes in this plan.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-05-cursos-criar-buscar-filtro-design.md`.
- **No automated tests are added in this plan** — same instruction as prior plans this project. Verification is `tsc --noEmit` plus a manual walkthrough (final task).
- **Do not run `git commit` for any step in this plan.** The user commits manually.
- Do not modify `EditCursoScreen.tsx` — it stays edit-only, untouched.
- Search is client-side only (filtering the already-fetched `cursos` array) — no new backend endpoint, no change to `listCursos`'s parameters.
- The "Criar curso" action must only be visible when `['Líder', 'Pastor', 'Administrador'].includes(user?.perfil ?? '')` — same rule used everywhere else in this app for creation actions.
- Follow existing screen conventions: header row with back arrow + centered title, `extractErrorMessage` for error text, `isLoading` driving `Button`'s `loading` prop, `flex-row flex-wrap` chip rows (see `EditCursoScreen.tsx`'s `CATEGORIAS` rendering) instead of hidden-indicator horizontal scrolling.
- No new npm dependencies.

---

### Task 1: `coursesService.createCurso`

**Files:**
- Modify: `igreja-app-front/src/services/courses.service.ts`

**Interfaces:**
- Produces: `coursesService.createCurso(payload: { nome: string; descricaoMaterial?: string;
  categoria: string }): Promise<Curso>`, consumed by `CreateCursoScreen.tsx` in Task 2.

- [ ] **Step 1: Add the method**

Open `igreja-app-front/src/services/courses.service.ts`. Add this method inside the
`coursesService` object, right after `getCurso` (before `updateCurso`):

```ts
  async createCurso(
    payload: { nome: string; descricaoMaterial?: string; categoria: string },
  ): Promise<Curso> {
    const { data } = await api.post('/api/cursos', payload);
    return data.data as Curso;
  },
```

Do not touch any other method or type in this file.

- [ ] **Step 2: Type-check**

Run: `cd "C:\Users\mathe\OneDrive\Área de Trabalho\igreja\igreja-app-front" && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Do not commit — leave the change in the working tree.**

---

### Task 2: `CreateCursoScreen` + route

**Files:**
- Modify: `igreja-app-front/src/navigation/types.ts`
- Create: `igreja-app-front/src/screens/ensino/CreateCursoScreen.tsx`
- Modify: `igreja-app-front/src/navigation/AppStack.tsx`

**Interfaces:**
- Consumes: `coursesService.createCurso(payload): Promise<Curso>` from Task 1; `Curso` type
  from `src/services/courses.service.ts` (`{ id, nome, descricaoMaterial, categoria,
  criador }`); `Button`, `TextField` from `src/components`; `extractErrorMessage` from
  `src/services/api`.
- Produces: `CreateCurso: undefined` route, consumed by Task 3 (`CoursesListScreen`'s
  "Criar curso" button).

- [ ] **Step 1: Add the route**

Open `igreja-app-front/src/navigation/types.ts`. Add `CreateCurso: undefined;` right after
`EditCurso: { id: string };`, so `AppStackParamList` reads:

```ts
export type AppStackParamList = {
  MainTabs: undefined;
  EditProfile: undefined;
  Devocionais: undefined;
  DevocionalDetail: { id: string };
  Eventos: undefined;
  CursoDetail: { id: string };
  EditCurso: { id: string };
  CreateCurso: undefined;
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

- [ ] **Step 2: Create `CreateCursoScreen.tsx`**

Create `igreja-app-front/src/screens/ensino/CreateCursoScreen.tsx` with this exact content:

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
import { coursesService, type Curso } from '../../services/courses.service';

type Props = NativeStackScreenProps<AppStackParamList, 'CreateCurso'>;

const CATEGORIAS: Curso['categoria'][] = ['Homens', 'Mulheres', 'Casais', 'Jovens', 'Geral', 'Batismo'];

export function CreateCursoScreen({ navigation }: Props) {
  const [nome, setNome] = useState('');
  const [descricaoMaterial, setDescricaoMaterial] = useState('');
  const [categoria, setCategoria] = useState<Curso['categoria']>('Geral');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function canSubmit(): boolean {
    return nome.trim().length > 0;
  }

  async function handleSubmit() {
    setError(null);
    setIsLoading(true);
    try {
      const curso = await coursesService.createCurso({
        nome: nome.trim(),
        descricaoMaterial: descricaoMaterial.trim(),
        categoria,
      });
      navigation.replace('CursoDetail', { id: String(curso.id) });
    } catch (e) {
      setError(extractErrorMessage(e, 'Não foi possível criar o curso.'));
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
        <Text className="font-serif-bold text-base text-primary">Criar Curso</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        className="flex-1 px-gutter"
        contentContainerClassName="gap-4 py-lg"
        keyboardShouldPersistTaps="handled"
      >
        <TextField
          label="Nome do curso *"
          placeholder="Ex: Fundamentos da Fé"
          value={nome}
          onChangeText={(v) => { setNome(v); setError(null); }}
        />

        <TextField
          label="Descrição"
          placeholder="Sobre o material do curso..."
          value={descricaoMaterial}
          onChangeText={setDescricaoMaterial}
          multiline
          numberOfLines={4}
        />

        <View className="gap-2">
          <Text className="font-sans-semibold text-xs uppercase tracking-wide text-ink-muted">
            Categoria
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {CATEGORIAS.map((c) => (
              <Pressable
                key={c}
                onPress={() => setCategoria(c)}
                className={[
                  'rounded-full border px-3 py-1.5',
                  categoria === c
                    ? 'border-primary bg-primary'
                    : 'border-outline-variant bg-surface-container-low',
                ].join(' ')}
              >
                <Text
                  className={[
                    'font-sans-medium text-xs',
                    categoria === c ? 'text-on-primary' : 'text-ink',
                  ].join(' ')}
                >
                  {c}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {error ? <Text className="font-sans text-xs text-error">{error}</Text> : null}

        <Button
          label="Criar curso"
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

Open `igreja-app-front/src/navigation/AppStack.tsx`. Add the import after the
`EditCursoScreen` import:

```ts
import { CreateCursoScreen } from '../screens/ensino/CreateCursoScreen';
```

Add the `<Stack.Screen>` entry right after `<Stack.Screen name="EditCurso" component={EditCursoScreen} />`:

```tsx
      <Stack.Screen name="CreateCurso" component={CreateCursoScreen} />
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit` (from the frontend repo root)
Expected: no errors in `CreateCursoScreen.tsx`, `types.ts`, or `AppStack.tsx`.

- [ ] **Step 5: Do not commit — leave the change in the working tree.**

---

### Task 3: Fix `CoursesListScreen` — filter wrap, search, "Criar curso"

**Files:**
- Modify: `igreja-app-front/src/screens/ensino/CoursesListScreen.tsx`

**Interfaces:**
- Consumes: `CreateCurso: undefined` route from Task 2; `useAuth()` → `{ user }` from
  `AuthContext` (not yet imported in this file); `TextField` from `src/components` (not yet
  imported in this file).

- [ ] **Step 1: Replace the full file content**

Replace the entire content of `igreja-app-front/src/screens/ensino/CoursesListScreen.tsx`
with:

```tsx
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Chip, SectionHeader, TextField } from '../../components';
import { colors } from '../../constants/theme';
import { useAuth } from '../../navigation/AuthContext';
import type { AppStackParamList } from '../../navigation/types';
import { coursesService, type Curso } from '../../services/courses.service';
import { extractErrorMessage } from '../../services/api';

type CategoriaFilter = Curso['categoria'] | 'todos';

const filters: { key: CategoriaFilter; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'Geral', label: 'Geral' },
  { key: 'Homens', label: 'Homens' },
  { key: 'Mulheres', label: 'Mulheres' },
  { key: 'Casais', label: 'Casais' },
  { key: 'Jovens', label: 'Jovens' },
  { key: 'Batismo', label: 'Batismo' },
];

export function CoursesListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { user } = useAuth();
  const isLeader = ['Líder', 'Pastor', 'Administrador'].includes(user?.perfil ?? '');
  const [activeFilter, setActiveFilter] = useState<CategoriaFilter>('todos');
  const [busca, setBusca] = useState('');
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await coursesService.listCursos();
        setCursos(data);
      } catch (e) {
        setError(extractErrorMessage(e));
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

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

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView className="flex-1 px-gutter" contentContainerClassName="gap-md py-lg">
        <SectionHeader
          eyebrow="Academia de Fé"
          title="Cursos & Formação"
          subtitle="Crescimento espiritual através do conhecimento bíblico."
          actionLabel={isLeader ? 'Criar curso' : undefined}
          onActionPress={isLeader ? () => navigation.navigate('CreateCurso') : undefined}
        />

        <TextField
          label="Buscar por curso ou responsável"
          placeholder="Ex: Fundamentos da Fé ou João Silva"
          value={busca}
          onChangeText={setBusca}
          autoCapitalize="none"
        />

        <View className="flex-row flex-wrap gap-2">
          {filters.map((filter) => (
            <Chip
              key={filter.key}
              label={filter.label}
              active={activeFilter === filter.key}
              onPress={() => setActiveFilter(filter.key)}
            />
          ))}
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={colors.gold} style={{ marginTop: 32 }} />
        ) : error ? (
          <View className="items-center gap-3 py-8">
            <Text className="text-center font-sans text-sm text-ink-muted">{error}</Text>
          </View>
        ) : filteredCursos.length === 0 ? (
          <Text className="py-8 text-center font-sans text-sm text-ink-muted">
            Nenhum curso encontrado.
          </Text>
        ) : (
          <View className="gap-3">
            {filteredCursos.map((curso) => (
              <Pressable
                key={curso.id}
                onPress={() => navigation.navigate('CursoDetail', { id: String(curso.id) })}
              >
                <Card contentClassName="gap-2">
                  <View className="flex-row items-start justify-between">
                    <Text className="flex-1 font-serif-bold text-lg text-ink">{curso.nome}</Text>
                    <Chip label={curso.categoria} tone="success" active />
                  </View>
                  {curso.descricaoMaterial ? (
                    <Text className="font-sans text-sm leading-5 text-ink-muted">
                      {curso.descricaoMaterial}
                    </Text>
                  ) : null}
                  <Text className="font-sans text-xs text-outline">
                    Por {curso.criador.nomeCompleto}
                  </Text>
                  <View className="mt-1 flex-row items-center justify-between border-t border-outline-variant pt-2">
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="school-outline" size={14} color={colors.outline} />
                      <Text className="font-sans text-xs text-ink-muted">{curso.categoria}</Text>
                    </View>
                    <Text className="font-sans-semibold text-sm text-secondary">Ver turmas</Text>
                  </View>
                </Card>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
```

Note: the empty-state message changed from "Nenhum curso disponível nesta categoria." to
"Nenhum curso encontrado." — with search added, the old wording would be misleading when a
search term (not just a category) is what's producing zero results.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit` (from the frontend repo root)
Expected: zero errors, project-wide. This is the last task in this plan.

- [ ] **Step 3: Do not commit — leave the change in the working tree.**

---

### Task 4: Manual end-to-end verification

**Files:** none (verification only).

- [ ] **Step 1: Confirm the backend is reachable**

No backend changes in this plan — just confirm `igreja-app-front/src/config.ts`'s
`API_BASE_URL` points at a running backend.

- [ ] **Step 2: Run the app**

Run: `cd "C:\Users\mathe\OneDrive\Área de Trabalho\igreja\igreja-app-front" && npx expo start`

- [ ] **Step 3: Exercise the flow**

1. Open the **Ensino** tab. Confirm all 7 category chips (Todos, Geral, Homens, Mulheres,
   Casais, Jovens, Batismo) are visible at once, wrapped onto as many rows as needed — no
   horizontal scrolling required to see any of them.
2. Type part of an existing course's name into the new search field — confirm the list
   narrows to matching courses.
3. Clear it and type part of a course creator's name instead — confirm the list narrows by
   creator too.
4. Combine a category filter with a search term — confirm both apply together.
5. As a Líder/Pastor/Administrador account: confirm "Criar curso" appears next to the
   section title. Tap it, fill in a name, pick a category, tap **Criar curso** — expect
   navigation straight to that course's detail screen, and confirm the course now shows up
   back in the Ensino list.
6. As a Membro-only account (not Líder/Pastor/Administrador): confirm "Criar curso" does NOT
   appear.

- [ ] **Step 4: Report results**

No commit for this task. If any step fails, identify which task's files are responsible,
fix the root cause there, re-run `tsc --noEmit`, and re-test before moving on.
