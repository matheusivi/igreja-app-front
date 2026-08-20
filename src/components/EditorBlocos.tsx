import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';
import { useSeletorImagem } from '../hooks/useSeletorImagem';
import { youtubeId, type BlocoConteudo } from '../services/content.service';

/** Bloco com id estável, para o React não remontar os campos ao reordenar. */
export type BlocoRascunho = BlocoConteudo & { id: string };

let contador = 0;
export function novoBloco(
  tipo: BlocoConteudo['tipo'],
  valor = '',
): BlocoRascunho {
  contador += 1;
  return { id: `bloco-${contador}`, tipo, valor };
}

export function paraRascunho(blocos: BlocoConteudo[]): BlocoRascunho[] {
  return blocos.map((b) => novoBloco(b.tipo, b.valor));
}

/**
 * Remove o id e descarta blocos vazios.
 *
 * Parágrafo em branco é lixo: acontece quando a pessoa adiciona um bloco e
 * desiste. Imagem ou vídeo sem valor idem.
 */
export function paraPayload(blocos: BlocoRascunho[]): BlocoConteudo[] {
  return blocos
    .map(({ tipo, valor }) => ({ tipo, valor: valor.trim() }))
    .filter((b) => b.valor.length > 0);
}

type EditorBlocosProps = {
  blocos: BlocoRascunho[];
  onChange: (blocos: BlocoRascunho[]) => void;
};

/**
 * Editor de post em blocos.
 *
 * A escrita é uma sequência: parágrafo, imagem, parágrafo, vídeo — na ordem
 * que a pessoa quiser, quantas vezes quiser. Antes eram três campos fixos
 * (um texto, uma imagem, um vídeo), o que impedia intercalar mídia no meio
 * do texto.
 */
export function EditorBlocos({ blocos, onChange }: EditorBlocosProps) {
  const colors = useThemeColors();
  const [menuAberto, setMenuAberto] = useState(false);

  function atualizar(id: string, valor: string) {
    onChange(blocos.map((b) => (b.id === id ? { ...b, valor } : b)));
  }

  function remover(id: string) {
    onChange(blocos.filter((b) => b.id !== id));
  }

  function mover(index: number, direcao: -1 | 1) {
    const destino = index + direcao;
    if (destino < 0 || destino >= blocos.length) return;
    const copia = [...blocos];
    const [movido] = copia.splice(index, 1);
    copia.splice(destino, 0, movido!);
    onChange(copia);
  }

  function adicionar(bloco: BlocoRascunho) {
    setMenuAberto(false);
    onChange([...blocos, bloco]);
  }

  // A imagem entra já hospedada: o seletor sobe para o Cloudinary e devolve
  // a URL, então o bloco nasce pronto em vez de guardar um arquivo local.
  const { abrir: escolherImagem, isEnviando } = useSeletorImagem({
    pasta: 'conteudos',
    onEnviada: (url) => adicionar(novoBloco('imagem', url)),
  });

  return (
    <View className="gap-2">
      <Text className="font-sans-semibold text-xs uppercase tracking-wide text-ink-muted">
        Conteúdo
      </Text>

      {blocos.length === 0 ? (
        <View className="items-center gap-1 rounded-lg border border-dashed border-outline-variant py-6">
          <Ionicons name="create-outline" size={24} color={colors.outline} />
          <Text className="font-sans text-sm text-ink-muted">
            Comece escrevendo ou adicionando uma imagem.
          </Text>
        </View>
      ) : null}

      {blocos.map((bloco, index) => (
        <View
          key={bloco.id}
          className="gap-1.5 rounded-lg border border-outline-variant bg-surface-container-low p-2"
        >
          <View className="flex-row items-center gap-2">
            <Ionicons
              name={
                bloco.tipo === 'texto'
                  ? 'text-outline'
                  : bloco.tipo === 'imagem'
                    ? 'image-outline'
                    : 'logo-youtube'
              }
              size={14}
              color={colors.outline}
            />
            <Text className="flex-1 font-sans text-[11px] uppercase tracking-wide text-ink-muted">
              {bloco.tipo === 'texto'
                ? 'Parágrafo'
                : bloco.tipo === 'imagem'
                  ? 'Imagem'
                  : 'Vídeo'}
            </Text>

            <Pressable
              onPress={() => mover(index, -1)}
              disabled={index === 0}
              hitSlop={6}
              accessibilityLabel="Mover para cima"
            >
              <Ionicons
                name="chevron-up"
                size={18}
                color={index === 0 ? colors.outlineVariant : colors.ink}
              />
            </Pressable>
            <Pressable
              onPress={() => mover(index, 1)}
              disabled={index === blocos.length - 1}
              hitSlop={6}
              accessibilityLabel="Mover para baixo"
            >
              <Ionicons
                name="chevron-down"
                size={18}
                color={
                  index === blocos.length - 1 ? colors.outlineVariant : colors.ink
                }
              />
            </Pressable>
            <Pressable
              onPress={() => remover(bloco.id)}
              hitSlop={6}
              accessibilityLabel="Remover bloco"
            >
              <Ionicons name="close" size={18} color={colors.error} />
            </Pressable>
          </View>

          {bloco.tipo === 'texto' ? (
            <TextInput
              className="min-h-[80px] font-sans text-base leading-6 text-ink"
              placeholder="Escreva aqui..."
              placeholderTextColor={colors.outline}
              value={bloco.valor}
              onChangeText={(v) => atualizar(bloco.id, v)}
              multiline
              textAlignVertical="top"
            />
          ) : bloco.tipo === 'imagem' ? (
            <Image
              source={{ uri: bloco.valor }}
              className="w-full rounded"
              style={{ aspectRatio: 16 / 9 }}
              resizeMode="cover"
            />
          ) : (
            <View className="gap-1">
              <TextInput
                className="font-sans text-sm text-ink"
                placeholder="https://youtube.com/watch?v=..."
                placeholderTextColor={colors.outline}
                value={bloco.valor}
                onChangeText={(v) => atualizar(bloco.id, v)}
                autoCapitalize="none"
                keyboardType="url"
              />
              {/* Avisa na hora, e não só ao salvar, se o link não for um
                  vídeo do YouTube reconhecível. */}
              {bloco.valor.trim() && !youtubeId(bloco.valor) ? (
                <Text className="font-sans text-xs text-error">
                  Link do YouTube não reconhecido.
                </Text>
              ) : null}
            </View>
          )}
        </View>
      ))}

      {isEnviando ? (
        <View className="flex-row items-center justify-center gap-2 py-3">
          <ActivityIndicator color={colors.gold} />
          <Text className="font-sans text-sm text-ink-muted">Enviando imagem…</Text>
        </View>
      ) : menuAberto ? (
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => adicionar(novoBloco('texto'))}
            className="flex-1 items-center gap-1 rounded-lg border border-outline-variant py-3"
          >
            {/* `text-outline`, não `text-ink-muted`: aquilo é classe do
                NativeWind, e tinha vazado para o nome do ícone. O Ionicons
                não reclama de nome inexistente — só não desenha nada. */}
            <Ionicons name="text-outline" size={18} color={colors.secondary} />
            <Text className="font-sans-medium text-xs text-secondary">Parágrafo</Text>
          </Pressable>
          <Pressable
            onPress={escolherImagem}
            className="flex-1 items-center gap-1 rounded-lg border border-outline-variant py-3"
          >
            <Ionicons name="image-outline" size={18} color={colors.secondary} />
            <Text className="font-sans-medium text-xs text-secondary">Imagem</Text>
          </Pressable>
          <Pressable
            onPress={() => adicionar(novoBloco('video'))}
            className="flex-1 items-center gap-1 rounded-lg border border-outline-variant py-3"
          >
            <Ionicons name="logo-youtube" size={18} color={colors.secondary} />
            <Text className="font-sans-medium text-xs text-secondary">Vídeo</Text>
          </Pressable>
          <Pressable
            onPress={() => setMenuAberto(false)}
            className="items-center justify-center rounded-lg border border-outline-variant px-3"
            accessibilityLabel="Fechar"
          >
            <Ionicons name="close" size={18} color={colors.outline} />
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={() => setMenuAberto(true)}
          className="flex-row items-center justify-center gap-2 rounded-lg border border-outline-variant py-3"
          accessibilityLabel="Adicionar ao conteúdo"
        >
          <Ionicons name="add-circle-outline" size={20} color={colors.secondary} />
          <Text className="font-sans-semibold text-sm text-secondary">Adicionar</Text>
        </Pressable>
      )}
    </View>
  );
}
