import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, ImagePickerField, TextField } from '../../components';
import { useThemeColors } from '../../hooks/useThemeColors';
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
  const colors = useThemeColors();
  const editId = route.params?.id;
  const isEditing = !!editId;
  const defaultTipo = route.params?.tipo ?? 'Devocional';

  const [tipo, setTipo] = useState<Conteudo['tipo']>(defaultTipo);
  const [titulo, setTitulo] = useState('');
  const [formato, setFormato] = useState<Conteudo['formato']>('texto');
  const [texto, setTexto] = useState('');
  const [imagemUrl, setImagemUrl] = useState<string | null>(null);
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
        setImagemUrl(conteudo.imagemUrl ?? null);
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
    if (showImagem && !imagemUrl) return false;
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
        ...(showImagem && imagemUrl ? { imagemUrl } : {}),
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

        {/* Imagem de capa */}
        {showImagem ? (
          <ImagePickerField
            label="Imagem *"
            pasta="conteudos"
            value={imagemUrl}
            onChange={(url) => { setImagemUrl(url); setError(null); }}
            hint="Aparece como capa na lista e no topo do conteúdo."
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
