# Editar/Deletar Conteúdo, Curso e Evento Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix two pre-existing data-shape bugs (Conteúdo, Curso) between the frontend and the real backend responses, then add edit/delete capability for Conteúdo, Curso, and Evento, gated by real ownership rules.

**Architecture:** Same shape-mismatch-fix pattern already used for Grupos Familiares: rewrite the broken service types to match the backend's actual JSON, fix every consumer screen, then layer edit/delete on top by reusing the existing `Create*Screen`s in a dual create/edit mode (accepting an optional `id` route param), plus a new `EditCursoScreen` (no create-curso screen exists to reuse). One small backend change adds a `criadorId`/`descricao` pair to the event month-view response, which the frontend needs to decide who can edit/delete each event card.

**Tech Stack:** Backend: Express, Zod, Prisma (`igreja-app-backend`). Frontend: React Native (Expo SDK 54), TypeScript, React Navigation native-stack, axios, NativeWind (`igreja-app-front`).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-03-editar-deletar-conteudo-curso-evento-design.md`.
- **No automated tests are added in this plan** — same instruction as the previous plan. Verification is `tsc --noEmit` in both repos plus a manual walkthrough (final task).
- **Do not run `git commit` for any step in this plan.** The user commits manually.
- Real ownership rule for edit/delete, confirmed directly in the backend services (not just the API doc): the item's creator, OR a user with `perfil` `'Pastor'` or `'Administrador'`, can edit/delete. A `'Líder'` who did not create the item cannot. Field names: `Conteudo.autor.id` (content owner), `Curso.criador.id` (course owner), `EventoItem.criadorId` (event owner, flat field — no nested object needed for this one).
- Delete confirmation uses React Native's built-in `Alert.alert` — no new dependency, and no other screen in this app uses a confirmation dialog yet, so this establishes the pattern.
- Follow existing screen conventions: header row with back arrow + centered title, `extractErrorMessage` for error text, `isLoading` state driving `Button`'s `loading` prop.
- No new npm dependencies in either repo.

---

## Part A — Conteúdo

### Task 1: Fix `content.service.ts` type

**Files:**
- Modify: `igreja-app-front/src/services/content.service.ts`

**Interfaces:**
- Produces: corrected `Conteudo` type (`dataPublicacao` instead of `createdAt`, `autor: {id, nomeCompleto, perfil}` instead of `autorNome?: string`, no `dataValidade` in the read type), consumed by Task 2 (screen fixes) and Task 4 (edit/delete UI).

- [ ] **Step 1: Replace the `Conteudo` type**

Open `igreja-app-front/src/services/content.service.ts`. Replace:

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
  dataValidade: string | null;
  createdAt: string;
  autorNome?: string;
};
```

with:

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

Do not touch `CreateConteudoPayload`, `makeExcerpt`, or any method in `contentService` — they
are unaffected (the payload type is for writes, which are unchanged; `get`/`list`/`create`/
`update`/`remove` all already exist and just return the corrected `Conteudo` type now).

- [ ] **Step 2: Type-check**

Run: `cd "C:\Users\mathe\OneDrive\Área de Trabalho\igreja\igreja-app-front" && npx tsc --noEmit`
Expected: errors in `src/screens/HomeScreen.tsx`, `src/screens/devocionais/DevotionalsListScreen.tsx`,
and `src/screens/devocionais/DevotionalDetailScreen.tsx` (fixed in Task 2 — not yours). Zero
errors in `content.service.ts` itself.

- [ ] **Step 3: Do not commit — leave the change in the working tree.**

---

### Task 2: Fix Conteúdo consumers (display only)

**Files:**
- Modify: `igreja-app-front/src/screens/HomeScreen.tsx`
- Modify: `igreja-app-front/src/screens/devocionais/DevotionalsListScreen.tsx`
- Modify: `igreja-app-front/src/screens/devocionais/DevotionalDetailScreen.tsx`

**Interfaces:**
- Consumes: corrected `Conteudo` type from Task 1.

- [ ] **Step 1: Fix `HomeScreen.tsx`**

Find:

```tsx
                  <Text className="mt-1 font-sans text-xs text-outline">
                    {new Date(aviso.createdAt).toLocaleDateString('pt-BR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Text>
```

Replace with:

```tsx
                  <Text className="mt-1 font-sans text-xs text-outline">
                    {new Date(aviso.dataPublicacao).toLocaleDateString('pt-BR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Text>
```

- [ ] **Step 2: Fix `DevotionalsListScreen.tsx`**

Find (appears once, in the featured-card block):

```tsx
                  {featured.autorNome ? (
                    <Text className="font-sans-medium text-xs text-outline">{featured.autorNome}</Text>
                  ) : null}
```

Replace with:

```tsx
                  <Text className="font-sans-medium text-xs text-outline">
                    {featured.autor.nomeCompleto}
                  </Text>
```

Find (appears once, in the list-item block):

```tsx
                    {item.autorNome ? (
                      <Text className="mt-1 font-sans-medium text-xs text-outline">
                        {item.autorNome}
                      </Text>
                    ) : null}
```

Replace with:

```tsx
                    <Text className="mt-1 font-sans-medium text-xs text-outline">
                      {item.autor.nomeCompleto}
                    </Text>
```

(`autor.nomeCompleto` is always present in the corrected type — no longer optional, so the
conditional wrapper is removed.)

- [ ] **Step 3: Fix `DevotionalDetailScreen.tsx`**

Find:

```tsx
          {conteudo.autorNome ? (
            <View className="flex-row items-center gap-2">
              <View className="h-9 w-9 items-center justify-center rounded-full bg-surface-container-high">
                <Ionicons name="person" size={16} color={colors.primary} />
              </View>
              <View>
                <Text className="font-sans-semibold text-sm text-ink">{conteudo.autorNome}</Text>
              </View>
              <Text className="ml-auto font-sans text-xs text-outline">
                {new Date(conteudo.createdAt).toLocaleDateString('pt-BR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </View>
          ) : (
            <Text className="font-sans text-xs text-outline">
              Publicado em{' '}
              {new Date(conteudo.createdAt).toLocaleDateString('pt-BR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          )}
```

Replace with:

```tsx
          <View className="flex-row items-center gap-2">
            <View className="h-9 w-9 items-center justify-center rounded-full bg-surface-container-high">
              <Ionicons name="person" size={16} color={colors.primary} />
            </View>
            <View>
              <Text className="font-sans-semibold text-sm text-ink">
                {conteudo.autor.nomeCompleto}
              </Text>
            </View>
            <Text className="ml-auto font-sans text-xs text-outline">
              {new Date(conteudo.dataPublicacao).toLocaleDateString('pt-BR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          </View>
```

(`autor` is always present now, so the "no author" fallback branch is removed.)

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit` (from the frontend repo root)
Expected: zero errors in these three files.

- [ ] **Step 3: Do not commit — leave the change in the working tree.**

---

### Task 3: `CreateConteudoScreen.tsx` edit mode

**Files:**
- Modify: `igreja-app-front/src/navigation/types.ts`
- Modify: `igreja-app-front/src/screens/lideranca/CreateConteudoScreen.tsx`

**Interfaces:**
- Consumes: `contentService.get(id)`, `contentService.update(id, payload)` (both already exist,
  unchanged signatures) from `content.service.ts`.
- Produces: `CreateConteudo` route now accepts an optional `id`, consumed by Task 4 (the
  "editar" button navigates here with an id).

- [ ] **Step 1: Widen the `CreateConteudo` route param type**

Open `igreja-app-front/src/navigation/types.ts`. Change:

```ts
  CreateConteudo: { tipo?: 'Devocional' | 'Estudo' | 'Aviso' } | undefined;
```

to:

```ts
  CreateConteudo: { tipo?: 'Devocional' | 'Estudo' | 'Aviso'; id?: string } | undefined;
```

- [ ] **Step 2: Add edit-mode to `CreateConteudoScreen.tsx`**

Open `igreja-app-front/src/screens/lideranca/CreateConteudoScreen.tsx`. Replace the whole
file with:

```tsx
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, TextField } from '../../components';
import { colors } from '../../constants/theme';
import type { AppStackParamList } from '../../navigation/types';
import { extractErrorMessage } from '../../services/api';
import {
  contentService,
  type Conteudo,
  type CreateConteudoPayload,
} from '../../services/content.service';

type Props = NativeStackScreenProps<AppStackParamList, 'CreateConteudo'>;

const TIPOS: Conteudo['tipo'][] = ['Devocional', 'Estudo', 'Aviso', 'Material', 'Apresentacao'];
const FORMATOS: Conteudo['formato'][] = ['texto', 'imagem', 'vídeo', 'combinacao'];

const tipoLabel: Record<Conteudo['tipo'], string> = {
  Devocional: 'Devocional',
  Estudo: 'Estudo',
  Aviso: 'Aviso',
  Material: 'Material',
  Apresentacao: 'Apresentação',
};

const formatoLabel: Record<Conteudo['formato'], string> = {
  texto: 'Texto',
  imagem: 'Imagem',
  'vídeo': 'Vídeo',
  combinacao: 'Combinação',
};

export function CreateConteudoScreen({ route, navigation }: Props) {
  const editId = route.params?.id;
  const isEditing = !!editId;
  const defaultTipo = route.params?.tipo ?? 'Devocional';

  const [tipo, setTipo] = useState<Conteudo['tipo']>(defaultTipo);
  const [titulo, setTitulo] = useState('');
  const [formato, setFormato] = useState<Conteudo['formato']>('texto');
  const [texto, setTexto] = useState('');
  const [imagemUrl, setImagemUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [principal, setPrincipal] = useState(false);
  const [isLoadingConteudo, setIsLoadingConteudo] = useState(isEditing);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editId) return;
    async function load() {
      setIsLoadingConteudo(true);
      try {
        const conteudo = await contentService.get(editId!);
        setTipo(conteudo.tipo);
        setTitulo(conteudo.titulo);
        setFormato(conteudo.formato);
        setTexto(conteudo.texto ?? '');
        setImagemUrl(conteudo.imagemUrl ?? '');
        setVideoUrl(conteudo.videoUrl ?? '');
        setPrincipal(conteudo.principal);
      } catch (e) {
        setError(extractErrorMessage(e, 'Não foi possível carregar o conteúdo.'));
      } finally {
        setIsLoadingConteudo(false);
      }
    }
    load();
  }, [editId]);

  const showTexto = formato === 'texto' || formato === 'combinacao';
  const showImagem = formato === 'imagem' || formato === 'combinacao';
  const showVideo = formato === 'vídeo' || formato === 'combinacao';

  function canSubmit(): boolean {
    if (!titulo.trim()) return false;
    if (showTexto && !texto.trim()) return false;
    if (showImagem && !imagemUrl.trim()) return false;
    if (showVideo && !videoUrl.trim()) return false;
    return true;
  }

  async function handleSubmit() {
    setError(null);
    setIsLoading(true);
    try {
      const payload: CreateConteudoPayload = {
        tipo,
        titulo: titulo.trim(),
        formato,
        principal,
        ...(showTexto && texto.trim() ? { texto: texto.trim() } : {}),
        ...(showImagem && imagemUrl.trim() ? { imagemUrl: imagemUrl.trim() } : {}),
        ...(showVideo && videoUrl.trim() ? { videoUrl: videoUrl.trim() } : {}),
      };
      if (isEditing) {
        await contentService.update(Number(editId), payload);
      } else {
        await contentService.create(payload);
      }
      navigation.goBack();
    } catch (e) {
      setError(
        extractErrorMessage(
          e,
          isEditing ? 'Não foi possível salvar as alterações.' : 'Não foi possível publicar o conteúdo.',
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoadingConteudo) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={colors.gold} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center justify-between border-b border-outline-variant px-gutter py-3">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </Pressable>
        <Text className="font-serif-bold text-base text-primary">
          {isEditing ? 'Editar Conteúdo' : 'Novo Conteúdo'}
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        className="flex-1 px-gutter"
        contentContainerClassName="gap-4 py-lg"
        keyboardShouldPersistTaps="handled"
      >
        {/* Tipo */}
        <View className="gap-2">
          <Text className="font-sans-semibold text-xs uppercase tracking-wide text-ink-muted">
            Tipo de conteúdo
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {TIPOS.map((t) => (
              <Pressable
                key={t}
                onPress={() => setTipo(t)}
                className={[
                  'rounded-full border px-3 py-1.5',
                  tipo === t
                    ? 'border-primary bg-primary'
                    : 'border-outline-variant bg-surface-container-low',
                ].join(' ')}
              >
                <Text
                  className={[
                    'font-sans-medium text-xs',
                    tipo === t ? 'text-on-primary' : 'text-ink',
                  ].join(' ')}
                >
                  {tipoLabel[t]}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Título */}
        <TextField
          label="Título *"
          placeholder="Digite o título do conteúdo"
          value={titulo}
          onChangeText={(v) => { setTitulo(v); setError(null); }}
        />

        {/* Formato */}
        <View className="gap-2">
          <Text className="font-sans-semibold text-xs uppercase tracking-wide text-ink-muted">
            Formato
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {FORMATOS.map((f) => (
              <Pressable
                key={f}
                onPress={() => setFormato(f)}
                className={[
                  'rounded-full border px-3 py-1.5',
                  formato === f
                    ? 'border-secondary bg-secondary'
                    : 'border-outline-variant bg-surface-container-low',
                ].join(' ')}
              >
                <Text
                  className={[
                    'font-sans-medium text-xs',
                    formato === f ? 'text-on-secondary' : 'text-ink',
                  ].join(' ')}
                >
                  {formatoLabel[f]}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Conteúdo textual */}
        {showTexto ? (
          <TextField
            label="Texto *"
            placeholder="Escreva o conteúdo aqui..."
            value={texto}
            onChangeText={(v) => { setTexto(v); setError(null); }}
            multiline
            numberOfLines={8}
          />
        ) : null}

        {/* URL de imagem */}
        {showImagem ? (
          <TextField
            label="URL da imagem *"
            placeholder="https://..."
            value={imagemUrl}
            onChangeText={(v) => { setImagemUrl(v); setError(null); }}
            autoCapitalize="none"
            keyboardType="url"
          />
        ) : null}

        {/* URL de vídeo */}
        {showVideo ? (
          <TextField
            label="URL do vídeo *"
            placeholder="https://..."
            value={videoUrl}
            onChangeText={(v) => { setVideoUrl(v); setError(null); }}
            autoCapitalize="none"
            keyboardType="url"
          />
        ) : null}

        {/* Destaque */}
        <Card contentClassName="flex-row items-center justify-between">
          <View>
            <Text className="font-sans-medium text-sm text-ink">Conteúdo em destaque</Text>
            <Text className="font-sans text-xs text-ink-muted">
              Aparece com destaque na lista
            </Text>
          </View>
          <Switch
            value={principal}
            onValueChange={setPrincipal}
            trackColor={{ true: colors.gold, false: colors.outline }}
            thumbColor={principal ? colors.onGold : colors.background}
          />
        </Card>

        {error ? (
          <Text className="font-sans text-xs text-error">{error}</Text>
        ) : null}

        <Button
          label={isEditing ? 'Salvar alterações' : 'Publicar conteúdo'}
          loading={isLoading}
          disabled={!canSubmit()}
          icon={<Ionicons name="cloud-upload-outline" size={16} color={colors.onGold} />}
          onPress={handleSubmit}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit` (from the frontend repo root)
Expected: zero errors in `CreateConteudoScreen.tsx` and `types.ts`.

- [ ] **Step 4: Do not commit — leave the change in the working tree.**

---

### Task 4: Edit/delete UI for Conteúdo

**Files:**
- Modify: `igreja-app-front/src/screens/devocionais/DevotionalsListScreen.tsx`
- Modify: `igreja-app-front/src/screens/devocionais/DevotionalDetailScreen.tsx`

**Interfaces:**
- Consumes: `contentService.remove(id): Promise<void>` (already exists) from
  `content.service.ts`; `CreateConteudo` route now takes `{ id?: string }` from Task 3;
  `useAuth()` → `{ user }` from `AuthContext`.

- [ ] **Step 1: Add edit/delete to `DevotionalsListScreen.tsx`**

Open `igreja-app-front/src/screens/devocionais/DevotionalsListScreen.tsx`.

Add `Alert` to the `react-native` import:

```tsx
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
```

Add a delete handler right after the `load` function (before `const filtered = useMemo(...)`):

```tsx
  function confirmDelete(id: number) {
    Alert.alert(
      'Excluir conteúdo',
      'Tem certeza que deseja excluir este conteúdo? Essa ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await contentService.remove(id);
              setConteudos((current) => current.filter((c) => c.id !== id));
            } catch (e) {
              Alert.alert('Erro', extractErrorMessage(e, 'Não foi possível excluir.'));
            }
          },
        },
      ],
    );
  }

  function canManage(conteudo: Conteudo): boolean {
    return (
      conteudo.autor.id === user?.id ||
      ['Pastor', 'Administrador'].includes(user?.perfil ?? '')
    );
  }
```

In the featured-card block, find:

```tsx
                <Card accent contentClassName="gap-2">
                  <Chip label="Destaque" tone="success" active />
                  <Text className="font-sans-semibold text-xs uppercase tracking-wide text-secondary">
                    {tipoLabel(featured.tipo)}
                  </Text>
                  <Text className="font-serif-bold text-xl text-ink">{featured.titulo}</Text>
                  <Text className="font-sans text-sm leading-5 text-ink-muted">
                    {makeExcerpt(featured.texto)}
                  </Text>
                  <Text className="font-sans-medium text-xs text-outline">
                    {featured.autor.nomeCompleto}
                  </Text>
                </Card>
```

Replace with:

```tsx
                <Card accent contentClassName="gap-2">
                  <View className="flex-row items-start justify-between">
                    <Chip label="Destaque" tone="success" active />
                    {canManage(featured) ? (
                      <View className="flex-row gap-3">
                        <Pressable
                          onPress={() =>
                            navigation.navigate('CreateConteudo', { id: String(featured.id) })
                          }
                          hitSlop={8}
                        >
                          <Ionicons name="pencil-outline" size={16} color={colors.secondary} />
                        </Pressable>
                        <Pressable onPress={() => confirmDelete(featured.id)} hitSlop={8}>
                          <Ionicons name="trash-outline" size={16} color={colors.error} />
                        </Pressable>
                      </View>
                    ) : null}
                  </View>
                  <Text className="font-sans-semibold text-xs uppercase tracking-wide text-secondary">
                    {tipoLabel(featured.tipo)}
                  </Text>
                  <Text className="font-serif-bold text-xl text-ink">{featured.titulo}</Text>
                  <Text className="font-sans text-sm leading-5 text-ink-muted">
                    {makeExcerpt(featured.texto)}
                  </Text>
                  <Text className="font-sans-medium text-xs text-outline">
                    {featured.autor.nomeCompleto}
                  </Text>
                </Card>
```

In the list-item block, find:

```tsx
                  <Card contentClassName="gap-1">
                    <Text className="font-sans-semibold text-xs uppercase tracking-wide text-secondary">
                      {tipoLabel(item.tipo)}
                    </Text>
                    <Text className="font-serif-bold text-lg text-ink">{item.titulo}</Text>
                    <Text className="font-sans text-sm leading-5 text-ink-muted">
                      {makeExcerpt(item.texto)}
                    </Text>
                    <Text className="mt-1 font-sans-medium text-xs text-outline">
                      {item.autor.nomeCompleto}
                    </Text>
                  </Card>
```

Replace with:

```tsx
                  <Card contentClassName="gap-1">
                    <View className="flex-row items-start justify-between">
                      <Text className="font-sans-semibold text-xs uppercase tracking-wide text-secondary">
                        {tipoLabel(item.tipo)}
                      </Text>
                      {canManage(item) ? (
                        <View className="flex-row gap-3">
                          <Pressable
                            onPress={() =>
                              navigation.navigate('CreateConteudo', { id: String(item.id) })
                            }
                            hitSlop={8}
                          >
                            <Ionicons name="pencil-outline" size={14} color={colors.secondary} />
                          </Pressable>
                          <Pressable onPress={() => confirmDelete(item.id)} hitSlop={8}>
                            <Ionicons name="trash-outline" size={14} color={colors.error} />
                          </Pressable>
                        </View>
                      ) : null}
                    </View>
                    <Text className="font-serif-bold text-lg text-ink">{item.titulo}</Text>
                    <Text className="font-sans text-sm leading-5 text-ink-muted">
                      {makeExcerpt(item.texto)}
                    </Text>
                    <Text className="mt-1 font-sans-medium text-xs text-outline">
                      {item.autor.nomeCompleto}
                    </Text>
                  </Card>
```

Both `<Card>`s above are wrapped in a `<Pressable onPress={() => navigation.navigate('DevocionalDetail', ...)}>`
already in the file — do not change that wrapper, only the `<Card>` contents inside it. The
inner edit/delete `Pressable`s stop propagation naturally in React Native (nested
`Pressable`s each get their own touch target; tapping the icon does not also trigger the
outer card's navigation because RN resolves the touch to the innermost responder).

- [ ] **Step 2: Add edit/delete to `DevotionalDetailScreen.tsx`**

Open `igreja-app-front/src/screens/devocionais/DevotionalDetailScreen.tsx`.

Add imports:

```tsx
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
```

```tsx
import { useAuth } from '../../navigation/AuthContext';
```

Add `const { user } = useAuth();` right after `export function DevotionalDetailScreen({ route, navigation }: Props) {`.

Replace the header's `bookmark-outline` icon:

```tsx
        <Text className="font-serif-bold text-base text-primary">IBVI Nova Andradina</Text>
        <Ionicons name="bookmark-outline" size={20} color={colors.primary} />
      </View>
```

with a conditional edit/delete pair (falls back to the bookmark icon when the user can't
manage this content, to keep the header layout balanced):

```tsx
        <Text className="font-serif-bold text-base text-primary">IBVI Nova Andradina</Text>
        {conteudo &&
        (conteudo.autor.id === user?.id ||
          ['Pastor', 'Administrador'].includes(user?.perfil ?? '')) ? (
          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={() => navigation.navigate('CreateConteudo', { id: String(conteudo.id) })}
              hitSlop={8}
            >
              <Ionicons name="pencil-outline" size={18} color={colors.secondary} />
            </Pressable>
            <Pressable
              onPress={() =>
                Alert.alert(
                  'Excluir conteúdo',
                  'Tem certeza que deseja excluir este conteúdo? Essa ação não pode ser desfeita.',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Excluir',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          await contentService.remove(conteudo.id);
                          navigation.goBack();
                        } catch (e) {
                          Alert.alert('Erro', extractErrorMessage(e, 'Não foi possível excluir.'));
                        }
                      },
                    },
                  ],
                )
              }
              hitSlop={8}
            >
              <Ionicons name="trash-outline" size={18} color={colors.error} />
            </Pressable>
          </View>
        ) : (
          <Ionicons name="bookmark-outline" size={20} color={colors.primary} />
        )}
      </View>
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit` (from the frontend repo root)
Expected: zero errors in both files.

- [ ] **Step 4: Do not commit — leave the change in the working tree.**

---

## Part B — Curso

### Task 5: Fix `courses.service.ts` type + add update/delete methods

**Files:**
- Modify: `igreja-app-front/src/services/courses.service.ts`

**Interfaces:**
- Produces: corrected `Curso` type, `coursesService.updateCurso(id, payload): Promise<Curso>`,
  `coursesService.deleteCurso(id): Promise<void>`. Consumed by Task 6 (screen fixes), Task 7
  (`EditCursoScreen`), Task 8 (delete UI).

- [ ] **Step 1: Replace the `Curso` type**

Open `igreja-app-front/src/services/courses.service.ts`. Replace:

```ts
export type Curso = {
  id: number;
  titulo: string;
  descricao: string | null;
  categoria: 'Homens' | 'Mulheres' | 'Casais' | 'Jovens' | 'Geral' | 'Batismo';
  criadorNome?: string;
  createdAt: string;
};
```

with:

```ts
export type Curso = {
  id: number;
  nome: string;
  descricaoMaterial: string | null;
  categoria: 'Homens' | 'Mulheres' | 'Casais' | 'Jovens' | 'Geral' | 'Batismo';
  criador: { id: number; nomeCompleto: string; perfil: string };
};
```

- [ ] **Step 2: Add `updateCurso` and `deleteCurso`**

Add these two methods inside the `coursesService` object, right after `getCurso`:

```ts
  async updateCurso(
    id: number,
    payload: { nome?: string; descricaoMaterial?: string; categoria?: string },
  ): Promise<Curso> {
    const { data } = await api.put(`/api/cursos/${id}`, payload);
    return data.data as Curso;
  },

  async deleteCurso(id: number): Promise<void> {
    await api.delete(`/api/cursos/${id}`);
  },
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit` (from the frontend repo root)
Expected: errors in `src/screens/ensino/CoursesListScreen.tsx` and
`src/screens/ensino/CourseDetailScreen.tsx` (fixed in Task 6 — not yours). Zero errors in
`courses.service.ts` itself.

- [ ] **Step 4: Do not commit — leave the change in the working tree.**

---

### Task 6: Fix Curso consumers (display only)

**Files:**
- Modify: `igreja-app-front/src/screens/ensino/CoursesListScreen.tsx`
- Modify: `igreja-app-front/src/screens/ensino/CourseDetailScreen.tsx`

**Interfaces:**
- Consumes: corrected `Curso` type from Task 5.

- [ ] **Step 1: Fix `CoursesListScreen.tsx`**

Find:

```tsx
                <Card contentClassName="gap-2">
                  <View className="flex-row items-start justify-between">
                    <Text className="flex-1 font-serif-bold text-lg text-ink">{curso.titulo}</Text>
                    <Chip label={curso.categoria} tone="success" active />
                  </View>
                  {curso.descricao ? (
                    <Text className="font-sans text-sm leading-5 text-ink-muted">
                      {curso.descricao}
                    </Text>
                  ) : null}
                  {curso.criadorNome ? (
                    <Text className="font-sans text-xs text-outline">Por {curso.criadorNome}</Text>
                  ) : null}
```

Replace with:

```tsx
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
```

- [ ] **Step 2: Fix `CourseDetailScreen.tsx`**

Find:

```tsx
          {curso.criadorNome ? (
            <Card contentClassName="flex-row items-center gap-3">
              <View className="h-11 w-11 items-center justify-center rounded-full bg-surface-container-high">
                <Ionicons name="person" size={20} color={colors.primary} />
              </View>
              <View>
                <Text className="font-sans-semibold text-sm text-ink">{curso.criadorNome}</Text>
                <Text className="font-sans text-xs text-ink-muted">Responsável pelo curso</Text>
              </View>
            </Card>
          ) : null}
```

Replace with:

```tsx
          <Card contentClassName="flex-row items-center gap-3">
            <View className="h-11 w-11 items-center justify-center rounded-full bg-surface-container-high">
              <Ionicons name="person" size={20} color={colors.primary} />
            </View>
            <View>
              <Text className="font-sans-semibold text-sm text-ink">
                {curso.criador.nomeCompleto}
              </Text>
              <Text className="font-sans text-xs text-ink-muted">Responsável pelo curso</Text>
            </View>
          </Card>
```

Find the two remaining uses of `curso!.titulo`:

```tsx
              onPress={() =>
                navigation.navigate('SalaParticipantes', {
                  salaId: sala.id,
                  cursoTitulo: curso!.titulo,
                })
              }
```

and:

```tsx
              onPress={() =>
                navigation.navigate('CreateSala', {
                  cursoId: route.params.id,
                  cursoTitulo: curso!.titulo,
                })
              }
```

Change `curso!.titulo` to `curso!.nome` in both places (the `cursoTitulo` param name itself
is untouched — only the source field changes).

Also fix the page title, which currently reads `curso.titulo` in the same file:

```tsx
            <Text className="font-serif-bold text-2xl text-ink">{curso.titulo}</Text>
            {curso.descricao ? (
              <Text className="font-sans text-sm leading-6 text-ink-muted">{curso.descricao}</Text>
            ) : null}
```

Replace with:

```tsx
            <Text className="font-serif-bold text-2xl text-ink">{curso.nome}</Text>
            {curso.descricaoMaterial ? (
              <Text className="font-sans text-sm leading-6 text-ink-muted">{curso.descricaoMaterial}</Text>
            ) : null}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit` (from the frontend repo root)
Expected: zero errors in both files.

- [ ] **Step 4: Do not commit — leave the change in the working tree.**

---

### Task 7: `EditCursoScreen` + route

**Files:**
- Modify: `igreja-app-front/src/navigation/types.ts`
- Create: `igreja-app-front/src/screens/ensino/EditCursoScreen.tsx`
- Modify: `igreja-app-front/src/navigation/AppStack.tsx`

**Interfaces:**
- Consumes: `coursesService.getCurso(id)`, `coursesService.updateCurso(id, payload)` from
  Task 5.
- Produces: `EditCurso: { id: string }` route, consumed by Task 8 (`CourseDetailScreen`'s
  edit button).

- [ ] **Step 1: Add the route**

Open `igreja-app-front/src/navigation/types.ts`. Add `EditCurso: { id: string };` right
after `CursoDetail: { id: string };`.

- [ ] **Step 2: Create `EditCursoScreen.tsx`**

Create `igreja-app-front/src/screens/ensino/EditCursoScreen.tsx` with this exact content:

```tsx
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, TextField } from '../../components';
import { colors } from '../../constants/theme';
import type { AppStackParamList } from '../../navigation/types';
import { extractErrorMessage } from '../../services/api';
import { coursesService, type Curso } from '../../services/courses.service';

type Props = NativeStackScreenProps<AppStackParamList, 'EditCurso'>;

const CATEGORIAS: Curso['categoria'][] = ['Homens', 'Mulheres', 'Casais', 'Jovens', 'Geral', 'Batismo'];

export function EditCursoScreen({ route, navigation }: Props) {
  const [nome, setNome] = useState('');
  const [descricaoMaterial, setDescricaoMaterial] = useState('');
  const [categoria, setCategoria] = useState<Curso['categoria']>('Geral');
  const [isLoadingCurso, setIsLoadingCurso] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setIsLoadingCurso(true);
      try {
        const curso = await coursesService.getCurso(route.params.id);
        setNome(curso.nome);
        setDescricaoMaterial(curso.descricaoMaterial ?? '');
        setCategoria(curso.categoria);
      } catch (e) {
        setError(extractErrorMessage(e, 'Não foi possível carregar o curso.'));
      } finally {
        setIsLoadingCurso(false);
      }
    }
    load();
  }, [route.params.id]);

  function canSubmit(): boolean {
    return nome.trim().length > 0;
  }

  async function handleSubmit() {
    setError(null);
    setIsLoading(true);
    try {
      await coursesService.updateCurso(Number(route.params.id), {
        nome: nome.trim(),
        descricaoMaterial: descricaoMaterial.trim(),
        categoria,
      });
      navigation.goBack();
    } catch (e) {
      setError(extractErrorMessage(e, 'Não foi possível salvar as alterações.'));
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoadingCurso) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={colors.gold} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center justify-between border-b border-outline-variant px-gutter py-3">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </Pressable>
        <Text className="font-serif-bold text-base text-primary">Editar Curso</Text>
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

Add the import after the `CourseDetailScreen` import:

```ts
import { EditCursoScreen } from '../screens/ensino/EditCursoScreen';
```

Add the `<Stack.Screen>` entry right after `<Stack.Screen name="CursoDetail" component={CourseDetailScreen} />`:

```tsx
      <Stack.Screen name="EditCurso" component={EditCursoScreen} />
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit` (from the frontend repo root)
Expected: zero errors in `EditCursoScreen.tsx`, `types.ts`, `AppStack.tsx`.

- [ ] **Step 5: Do not commit — leave the change in the working tree.**

---

### Task 8: Edit/delete UI in `CourseDetailScreen`

**Files:**
- Modify: `igreja-app-front/src/screens/ensino/CourseDetailScreen.tsx`

**Interfaces:**
- Consumes: `coursesService.deleteCurso(id)` from Task 5; `EditCurso` route from Task 7;
  `useAuth()` → `{ user }` (already imported in this file).

- [ ] **Step 1: Add the edit icon and delete button**

Open `igreja-app-front/src/screens/ensino/CourseDetailScreen.tsx`.

Add `Alert` to the `react-native` import:

```tsx
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
```

Add this right after the `isLeader` line:

```tsx
  const canManage =
    curso?.criador.id === user?.id || ['Pastor', 'Administrador'].includes(user?.perfil ?? '');
```

(`curso` is `Curso | null` at this point in the component, so `curso?.criador.id` handles
the not-yet-loaded case safely.)

Replace the header's decorative share icon:

```tsx
        <Text className="font-serif-bold text-base text-primary" numberOfLines={1}>
          IBVI Nova Andradina
        </Text>
        <Ionicons name="share-outline" size={20} color={colors.primary} />
      </View>
```

with:

```tsx
        <Text className="font-serif-bold text-base text-primary" numberOfLines={1}>
          IBVI Nova Andradina
        </Text>
        {canManage ? (
          <Pressable
            onPress={() => navigation.navigate('EditCurso', { id: route.params.id })}
            hitSlop={8}
          >
            <Ionicons name="pencil-outline" size={20} color={colors.primary} />
          </Pressable>
        ) : (
          <View style={{ width: 20 }} />
        )}
      </View>
```

Add a delete button at the very end of the scrollable content, right after the closing tag
of the "Certificado incluso" `Card` and before `</ScrollView>`:

```tsx
          </Card>

          {canManage ? (
            <Button
              label="Excluir curso"
              variant="secondary"
              icon={<Ionicons name="trash-outline" size={16} color={colors.error} />}
              onPress={() =>
                Alert.alert(
                  'Excluir curso',
                  'Tem certeza que deseja excluir este curso? Essa ação não pode ser desfeita.',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Excluir',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          await coursesService.deleteCurso(Number(route.params.id));
                          navigation.goBack();
                        } catch (e) {
                          Alert.alert('Erro', extractErrorMessage(e, 'Não foi possível excluir.'));
                        }
                      },
                    },
                  ],
                )
              }
            />
          ) : null}
        </ScrollView>
```

(The original file has just `</Card>` then `</ScrollView>` at the very end — this step
inserts the new button between them.)

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit` (from the frontend repo root)
Expected: zero errors in this file.

- [ ] **Step 3: Do not commit — leave the change in the working tree.**

---

## Part C — Evento

### Task 9: Backend — add `criadorId` and `descricao` to event month view

**Files:**
- Modify: `igreja-app-backend/src/dtos/evento.dto.ts`
- Modify: `igreja-app-backend/src/services/evento.services.ts`

**Interfaces:**
- Produces: `EventoOcorrencia` now includes `descricao: string | null` and
  `criadorId: number`, consumed by Task 10 (frontend `EventoItem` type).

- [ ] **Step 1: Extend `EventoOcorrencia`**

Open `igreja-app-backend/src/dtos/evento.dto.ts`. Replace:

```ts
export interface EventoOcorrencia {
  id: number;
  titulo: string;
  tipo: string;
  cor: string | null;
  dataInicio: Date;
  dataFim: Date | null;
  local: string | null;
  recorrencia: string;
}
```

with:

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

- [ ] **Step 2: Populate the two new fields**

Open `igreja-app-backend/src/services/evento.services.ts`. Find the `toOcorrencia` method:

```ts
  private toOcorrencia(
    evento: EventoComCriadorSimples,
    dataInicio: Date,
  ): EventoOcorrencia {
    return {
      id: evento.id,
      titulo: evento.titulo,
      tipo: evento.tipo,
      cor: evento.cor,
      dataInicio,
      dataFim: evento.dataFim,
      local: evento.local,
      recorrencia: evento.recorrencia,
    };
  }
```

Replace with:

```ts
  private toOcorrencia(
    evento: EventoComCriadorSimples,
    dataInicio: Date,
  ): EventoOcorrencia {
    return {
      id: evento.id,
      titulo: evento.titulo,
      descricao: evento.descricao,
      tipo: evento.tipo,
      cor: evento.cor,
      dataInicio,
      dataFim: evento.dataFim,
      local: evento.local,
      recorrencia: evento.recorrencia,
      criadorId: evento.criadorId,
    };
  }
```

(`EventoComCriadorSimples` already has both `descricao` and `criadorId` — confirm this by
checking `igreja-app-backend/src/dtos/evento.dto.ts`'s `EventoComCriadorSimples` interface;
it does, so no other type needs changing.)

- [ ] **Step 3: Type-check**

Run: `cd "C:\Users\mathe\OneDrive\Área de Trabalho\igreja\igreja-app-backend" && npx tsc --noEmit --project tsconfig.json`
Expected: no errors.

- [ ] **Step 4: Do not commit — leave the change in the working tree.**

---

### Task 10: Frontend `events.service.ts` — `criadorId`, `EventoDetalhe`, `getEvento`, `deleteEvento`

**Files:**
- Modify: `igreja-app-front/src/services/events.service.ts`

**Interfaces:**
- Consumes: backend's extended `EventoOcorrencia` from Task 9 (same field names).
- Produces: `EventoItem` now has `criadorId: number`; new type `EventoDetalhe`; new methods
  `eventsService.getEvento(id): Promise<EventoDetalhe>`,
  `eventsService.deleteEvento(id): Promise<void>`. Consumed by Task 11 (edit mode) and
  Task 12 (delete UI).

- [ ] **Step 1: Add `criadorId` to `EventoItem`**

Open `igreja-app-front/src/services/events.service.ts`. Change:

```ts
export type EventoItem = {
  id: number;
  titulo: string;
  tipo: 'Culto' | 'Reunião' | 'Retiro' | 'Conferência' | 'Outro';
  cor: string | null;
  dataInicio: string;
  dataFim: string | null;
  local: string | null;
  descricao: string | null;
  recorrencia: 'nenhuma' | 'semanal' | 'mensal';
};
```

to:

```ts
export type EventoItem = {
  id: number;
  titulo: string;
  tipo: 'Culto' | 'Reunião' | 'Retiro' | 'Conferência' | 'Outro';
  cor: string | null;
  dataInicio: string;
  dataFim: string | null;
  local: string | null;
  descricao: string | null;
  recorrencia: 'nenhuma' | 'semanal' | 'mensal';
  criadorId: number;
};
```

- [ ] **Step 2: Add `EventoDetalhe` type and the two new methods**

Add this type right after `CreateEventoPayload`:

```ts
export type EventoDetalhe = EventoItem & {
  diaSemana: number | null;
  diaDoMes: number | null;
  dataFimRecorrencia: string | null;
};
```

Add these two methods inside `eventsService`, right after `updateEvento`:

```ts
  async getEvento(id: string | number): Promise<EventoDetalhe> {
    const { data } = await api.get(`/api/eventos/${id}`);
    return data.data as EventoDetalhe;
  },

  async deleteEvento(id: number): Promise<void> {
    await api.delete(`/api/eventos/${id}`);
  },
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit` (from the frontend repo root)
Expected: no errors in `events.service.ts` itself. (`EventsScreen.tsx` and
`CreateEventoScreen.tsx` are unaffected by this task alone — `criadorId` being added to
`EventoItem` doesn't break existing code that doesn't read it.)

- [ ] **Step 4: Do not commit — leave the change in the working tree.**

---

### Task 11: `CreateEventoScreen.tsx` edit mode

**Files:**
- Modify: `igreja-app-front/src/navigation/types.ts`
- Modify: `igreja-app-front/src/screens/lideranca/CreateEventoScreen.tsx`

**Interfaces:**
- Consumes: `eventsService.getEvento(id): Promise<EventoDetalhe>`,
  `eventsService.updateEvento(id, payload)` (already existed) from Task 10.
- Produces: `CreateEvento` route now accepts an optional `id`, consumed by Task 12 (the
  "editar" button on `EventsScreen`).

- [ ] **Step 1: Widen the `CreateEvento` route param type**

Open `igreja-app-front/src/navigation/types.ts`. Change:

```ts
  CreateEvento: undefined;
```

to:

```ts
  CreateEvento: { id?: string } | undefined;
```

- [ ] **Step 2: Add edit-mode to `CreateEventoScreen.tsx`**

Open `igreja-app-front/src/screens/lideranca/CreateEventoScreen.tsx`. Replace the whole file
with:

```tsx
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, TextField } from '../../components';
import { colors } from '../../constants/theme';
import type { AppStackParamList } from '../../navigation/types';
import { extractErrorMessage } from '../../services/api';
import { eventsService, type CreateEventoPayload, type EventoItem } from '../../services/events.service';

type Props = NativeStackScreenProps<AppStackParamList, 'CreateEvento'>;

const TIPOS: EventoItem['tipo'][] = ['Culto', 'Reunião', 'Retiro', 'Conferência', 'Outro'];
const RECORRENCIAS: CreateEventoPayload['recorrencia'][] = ['nenhuma', 'semanal', 'mensal'];
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const PRESET_COLORS = [
  { label: 'Dourado', value: '#F59E0B' },
  { label: 'Azul', value: '#1E40AF' },
  { label: 'Verde', value: '#006C49' },
  { label: 'Vermelho', value: '#BA1A1A' },
  { label: 'Roxo', value: '#7C3AED' },
];

function buildISO(dateStr: string, timeStr: string): string | null {
  const dateMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dateStr.trim());
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(timeStr.trim());
  if (!dateMatch || !timeMatch) return null;
  const [, d, m, y] = dateMatch;
  const [, h, min] = timeMatch;
  const date = new Date(`${y}-${m}-${d}T${h}:${min}:00`);
  if (isNaN(date.getTime())) return null;
  return date.toISOString();
}

function isoToDateStr(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function isoToTimeStr(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${min}`;
}

export function CreateEventoScreen({ route, navigation }: Props) {
  const editId = route.params?.id;
  const isEditing = !!editId;

  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState<EventoItem['tipo']>('Culto');
  const [dataStr, setDataStr] = useState('');
  const [horaStr, setHoraStr] = useState('');
  const [local, setLocal] = useState('');
  const [descricao, setDescricao] = useState('');
  const [recorrencia, setRecorrencia] = useState<CreateEventoPayload['recorrencia']>('nenhuma');
  const [diaSemana, setDiaSemana] = useState<number>(0);
  const [diaDoMes, setDiaDoMes] = useState('');
  const [cor, setCor] = useState('');
  const [isLoadingEvento, setIsLoadingEvento] = useState(isEditing);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editId) return;
    async function load() {
      setIsLoadingEvento(true);
      try {
        const evento = await eventsService.getEvento(editId!);
        setTitulo(evento.titulo);
        setTipo(evento.tipo);
        setDataStr(isoToDateStr(evento.dataInicio));
        setHoraStr(isoToTimeStr(evento.dataInicio));
        setLocal(evento.local ?? '');
        setDescricao(evento.descricao ?? '');
        setRecorrencia(evento.recorrencia);
        setDiaSemana(evento.diaSemana ?? 0);
        setDiaDoMes(evento.diaDoMes ? String(evento.diaDoMes) : '');
        setCor(evento.cor ?? '');
      } catch (e) {
        setError(extractErrorMessage(e, 'Não foi possível carregar o evento.'));
      } finally {
        setIsLoadingEvento(false);
      }
    }
    load();
  }, [editId]);

  function canSubmit(): boolean {
    if (!titulo.trim()) return false;
    if (!dataStr.trim() || !horaStr.trim()) return false;
    if (!buildISO(dataStr, horaStr)) return false;
    if (recorrencia === 'mensal' && !diaDoMes.trim()) return false;
    return true;
  }

  async function handleSubmit() {
    setError(null);
    const iso = buildISO(dataStr, horaStr);
    if (!iso) {
      setError('Data ou hora inválida. Use DD/MM/AAAA e HH:MM.');
      return;
    }
    setIsLoading(true);
    try {
      const payload: CreateEventoPayload = {
        titulo: titulo.trim(),
        dataInicio: iso,
        tipo,
        recorrencia,
        ...(local.trim() ? { local: local.trim() } : {}),
        ...(descricao.trim() ? { descricao: descricao.trim() } : {}),
        ...(cor ? { cor } : {}),
        ...(recorrencia === 'semanal' ? { diaSemana } : {}),
        ...(recorrencia === 'mensal' && diaDoMes.trim()
          ? { diaDoMes: parseInt(diaDoMes.trim(), 10) }
          : {}),
      };
      if (isEditing) {
        await eventsService.updateEvento(Number(editId), payload);
      } else {
        await eventsService.createEvento(payload);
      }
      navigation.goBack();
    } catch (e) {
      setError(
        extractErrorMessage(
          e,
          isEditing ? 'Não foi possível salvar as alterações.' : 'Não foi possível criar o evento.',
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoadingEvento) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={colors.gold} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center justify-between border-b border-outline-variant px-gutter py-3">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </Pressable>
        <Text className="font-serif-bold text-base text-primary">
          {isEditing ? 'Editar Evento' : 'Novo Evento'}
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        className="flex-1 px-gutter"
        contentContainerClassName="gap-4 py-lg"
        keyboardShouldPersistTaps="handled"
      >
        {/* Título */}
        <TextField
          label="Título *"
          placeholder="Nome do evento"
          value={titulo}
          onChangeText={(v) => { setTitulo(v); setError(null); }}
        />

        {/* Tipo */}
        <View className="gap-2">
          <Text className="font-sans-semibold text-xs uppercase tracking-wide text-ink-muted">
            Tipo
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {TIPOS.map((t) => (
              <Pressable
                key={t}
                onPress={() => setTipo(t)}
                className={[
                  'rounded-full border px-3 py-1.5',
                  tipo === t
                    ? 'border-primary bg-primary'
                    : 'border-outline-variant bg-surface-container-low',
                ].join(' ')}
              >
                <Text
                  className={[
                    'font-sans-medium text-xs',
                    tipo === t ? 'text-on-primary' : 'text-ink',
                  ].join(' ')}
                >
                  {t}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Data e hora */}
        <View className="flex-row gap-3">
          <View className="flex-1">
            <TextField
              label="Data *"
              placeholder="DD/MM/AAAA"
              value={dataStr}
              onChangeText={(v) => { setDataStr(v); setError(null); }}
              keyboardType="numeric"
              maxLength={10}
            />
          </View>
          <View className="flex-1">
            <TextField
              label="Hora *"
              placeholder="HH:MM"
              value={horaStr}
              onChangeText={(v) => { setHoraStr(v); setError(null); }}
              keyboardType="numeric"
              maxLength={5}
            />
          </View>
        </View>

        {/* Local */}
        <TextField
          label="Local"
          placeholder="Ex: Templo principal"
          value={local}
          onChangeText={setLocal}
        />

        {/* Descrição */}
        <TextField
          label="Descrição"
          placeholder="Detalhes sobre o evento..."
          value={descricao}
          onChangeText={setDescricao}
          multiline
          numberOfLines={4}
        />

        {/* Recorrência */}
        <View className="gap-2">
          <Text className="font-sans-semibold text-xs uppercase tracking-wide text-ink-muted">
            Recorrência
          </Text>
          <View className="flex-row gap-2">
            {RECORRENCIAS.map((r) => {
              const label = r === 'nenhuma' ? 'Nenhuma' : r === 'semanal' ? 'Semanal' : 'Mensal';
              return (
                <Pressable
                  key={r}
                  onPress={() => setRecorrencia(r)}
                  className={[
                    'rounded-full border px-3 py-1.5',
                    recorrencia === r
                      ? 'border-secondary bg-secondary'
                      : 'border-outline-variant bg-surface-container-low',
                  ].join(' ')}
                >
                  <Text
                    className={[
                      'font-sans-medium text-xs',
                      recorrencia === r ? 'text-on-secondary' : 'text-ink',
                    ].join(' ')}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Dia da semana — se semanal */}
        {recorrencia === 'semanal' ? (
          <View className="gap-2">
            <Text className="font-sans-semibold text-xs uppercase tracking-wide text-ink-muted">
              Dia da semana
            </Text>
            <View className="flex-row gap-1.5">
              {DIAS_SEMANA.map((d, idx) => (
                <Pressable
                  key={d}
                  onPress={() => setDiaSemana(idx)}
                  className={[
                    'flex-1 items-center rounded-lg border py-2',
                    diaSemana === idx
                      ? 'border-gold bg-gold'
                      : 'border-outline-variant bg-surface-container-low',
                  ].join(' ')}
                >
                  <Text
                    className={[
                      'font-sans-medium text-xs',
                      diaSemana === idx ? 'text-on-gold' : 'text-ink',
                    ].join(' ')}
                  >
                    {d}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {/* Dia do mês — se mensal */}
        {recorrencia === 'mensal' ? (
          <TextField
            label="Dia do mês *"
            placeholder="Ex: 15"
            value={diaDoMes}
            onChangeText={(v) => { setDiaDoMes(v); setError(null); }}
            keyboardType="numeric"
            maxLength={2}
          />
        ) : null}

        {/* Cor */}
        <View className="gap-2">
          <Text className="font-sans-semibold text-xs uppercase tracking-wide text-ink-muted">
            Cor do evento
          </Text>
          <View className="flex-row items-center gap-3">
            {PRESET_COLORS.map((preset) => (
              <Pressable
                key={preset.value}
                onPress={() => setCor(cor === preset.value ? '' : preset.value)}
                className="h-8 w-8 items-center justify-center rounded-full"
                style={{ backgroundColor: preset.value }}
              >
                {cor === preset.value ? (
                  <Ionicons name="checkmark" size={14} color="white" />
                ) : null}
              </Pressable>
            ))}
            <Pressable
              onPress={() => setCor('')}
              className={[
                'h-8 w-8 items-center justify-center rounded-full border',
                !cor ? 'border-primary bg-surface-container-low' : 'border-outline-variant',
              ].join(' ')}
            >
              {!cor ? <Ionicons name="checkmark" size={14} color={colors.primary} /> : null}
            </Pressable>
          </View>
          {cor ? (
            <Text className="font-sans text-xs text-ink-muted">
              Cor selecionada: <Text className="font-sans-semibold">{cor}</Text>
            </Text>
          ) : (
            <Text className="font-sans text-xs text-ink-muted">Sem cor (padrão)</Text>
          )}
        </View>

        {error ? (
          <Text className="font-sans text-xs text-error">{error}</Text>
        ) : null}

        <Button
          label={isEditing ? 'Salvar alterações' : 'Criar evento'}
          loading={isLoading}
          disabled={!canSubmit()}
          icon={<Ionicons name="calendar-outline" size={16} color={colors.onGold} />}
          onPress={handleSubmit}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit` (from the frontend repo root)
Expected: zero errors in `CreateEventoScreen.tsx` and `types.ts`.

- [ ] **Step 4: Do not commit — leave the change in the working tree.**

---

### Task 12: Edit/delete UI in `EventsScreen`

**Files:**
- Modify: `igreja-app-front/src/screens/eventos/EventsScreen.tsx`

**Interfaces:**
- Consumes: `eventsService.deleteEvento(id)` from Task 10; `CreateEvento` route now takes
  `{ id?: string }` from Task 11; `user` from `useAuth()` (already imported in this file);
  `EventoItem.criadorId` from Task 10.

- [ ] **Step 1: Add `Alert` import and a delete handler**

Open `igreja-app-front/src/screens/eventos/EventsScreen.tsx`.

Add `Alert` to the `react-native` import:

```tsx
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
```

Add this function right after `confirmaLabel` (top-level, outside the component):

```tsx
function canManageEvento(event: EventoItem, userId?: number, perfil?: string): boolean {
  return event.criadorId === userId || ['Pastor', 'Administrador'].includes(perfil ?? '');
}
```

Add this handler inside `EventsScreen`, right after the `goToNextMonth` function:

```tsx
  function confirmDeleteEvento(eventId: number) {
    Alert.alert(
      'Excluir evento',
      'Tem certeza que deseja excluir este evento? Essa ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await eventsService.deleteEvento(eventId);
              const result = await eventsService.fetchMes(
                currentDate.getMonth() + 1,
                currentDate.getFullYear(),
              );
              setEventosMes(result);
            } catch (e) {
              Alert.alert('Erro', extractErrorMessage(e, 'Não foi possível excluir.'));
            }
          },
        },
      ],
    );
  }
```

- [ ] **Step 2: Add edit/delete icons to each event card**

Find the card header block:

```tsx
              <Card key={`${event.id}-${event.dia}`} contentClassName="gap-2">
                <View className="flex-row items-center gap-2">
                  {event.cor ? (
                    <View
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: event.cor }}
                    />
                  ) : null}
                  <Text className="font-sans-semibold text-xs uppercase tracking-wide text-secondary">
                    {event.tipo}
                  </Text>
                </View>
```

Replace with:

```tsx
              <Card key={`${event.id}-${event.dia}`} contentClassName="gap-2">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    {event.cor ? (
                      <View
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: event.cor }}
                      />
                    ) : null}
                    <Text className="font-sans-semibold text-xs uppercase tracking-wide text-secondary">
                      {event.tipo}
                    </Text>
                  </View>
                  {canManageEvento(event, user?.id, user?.perfil) ? (
                    <View className="flex-row gap-3">
                      <Pressable
                        onPress={() => navigation.navigate('CreateEvento', { id: String(event.id) })}
                        hitSlop={8}
                      >
                        <Ionicons name="pencil-outline" size={14} color={colors.secondary} />
                      </Pressable>
                      <Pressable onPress={() => confirmDeleteEvento(event.id)} hitSlop={8}>
                        <Ionicons name="trash-outline" size={14} color={colors.error} />
                      </Pressable>
                    </View>
                  ) : null}
                </View>
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit` (from the frontend repo root)
Expected: zero errors, project-wide (this is the last task touching Evento).

- [ ] **Step 4: Do not commit — leave the change in the working tree.**

---

## Part D — Verification

### Task 13: Manual end-to-end verification

**Files:** none (verification only).

- [ ] **Step 1: Confirm both servers are reachable**

Backend running (`npm run dev` in `igreja-app-backend`, so Task 9's route/service change is
picked up by nodemon), and `igreja-app-front/src/config.ts`'s `API_BASE_URL` pointing at the
current machine IP.

- [ ] **Step 2: Run the app**

Run: `cd "C:\Users\mathe\OneDrive\Área de Trabalho\igreja\igreja-app-front" && npx expo start`
Log in as a user with `perfil` `'Líder'` (to test owner-only editing) and, separately, as a
`'Pastor'` or `'Administrador'` (to test edit-any) if such accounts exist.

- [ ] **Step 3: Conteúdo**

1. Home screen: confirm "Avisos recentes" shows real dates (not "Invalid Date").
2. Devocionais: confirm the featured card and list items show the real author name, not
   blank.
3. As the author (or Pastor/Admin): tap the pencil icon on a devotional — should prefill
   `CreateConteudo` and let you save changes. Tap the trash icon — confirm dialog, then item
   disappears from the list.
4. As a Líder who is NOT the author of some content: confirm no pencil/trash icons show for
   that item.
5. Open a devotional's detail screen and repeat the edit/delete check from the header icons.

- [ ] **Step 4: Curso**

1. Cursos list: confirm real course names, descriptions, and creator names show (not
   blank/undefined).
2. As the creator (or Pastor/Admin): open a course detail, tap the pencil in the header —
   `EditCursoScreen` opens prefilled, save works.
3. Tap "Excluir curso" on a course with no active enrollments — confirm dialog, course
   deletes, navigates back.
4. Tap "Excluir curso" on a course that DOES have active enrollments — expect the backend's
   409 message ("Este curso não pode ser excluído pois há alunos com matrículas ativas...")
   shown inline, not a crash.

- [ ] **Step 5: Evento**

1. Eventos screen: confirm event cards for recurring events now show a description when one
   exists (previously blank regardless of what was entered at creation).
2. As the creator (or Pastor/Admin) of an event: tap the pencil icon on its card —
   `CreateEvento` opens prefilled (including day-of-week/day-of-month for recurring events),
   save works.
3. Tap the trash icon — confirm dialog, event disappears from the current month view.
4. As someone who didn't create a given event and isn't Pastor/Admin: confirm no
   pencil/trash icons show on that event's card.

- [ ] **Step 6: Report results**

No commit for this task. If any step fails, identify which task's files are responsible,
fix the root cause there, re-run the relevant `tsc --noEmit`, and re-test before moving on.
