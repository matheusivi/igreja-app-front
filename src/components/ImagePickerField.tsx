import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';
import { useSeletorImagem } from '../hooks/useSeletorImagem';
import type { PastaUpload } from '../services/upload.service';

type ImagePickerFieldProps = {
  label: string;
  /** URL já hospedada, ou null quando ainda não há imagem. */
  value: string | null;
  onChange: (url: string | null) => void;
  pasta: PastaUpload;
  /** Texto de apoio abaixo do campo. */
  hint?: string;
  /** Proporção da área de preview. 16/9 por padrão (capa). */
  aspectRatio?: number;
};

/**
 * Campo de imagem do design system.
 *
 * Existe para que capa de evento, capa de devocional e foto de grupo familiar
 * compartilhem o mesmo comportamento: mesmo estado vazio, mesmo indicador de
 * envio, mesmo menu de origem. Antes o líder tinha que digitar uma URL na mão —
 * inviável para quem está no celular.
 */
export function ImagePickerField({
  label,
  value,
  onChange,
  pasta,
  hint,
  aspectRatio = 16 / 9,
}: ImagePickerFieldProps) {
  const colors = useThemeColors();

  const { abrir, isEnviando } = useSeletorImagem({
    pasta,
    quadrado: aspectRatio === 1,
    onEnviada: onChange,
    // A opção "Remover" só aparece quando já existe imagem — oferecer antes
    // disso seria uma ação sem efeito nenhum.
    ...(value ? { onRemovida: () => onChange(null) } : {}),
  });

  return (
    <View className="gap-1.5">
      <Text className="font-sans-medium text-xs text-ink-muted">{label}</Text>

      <Pressable
        onPress={abrir}
        disabled={isEnviando}
        accessibilityRole="button"
        accessibilityLabel={value ? `Alterar ${label}` : `Escolher ${label}`}
        className="overflow-hidden rounded-lg border border-outline-variant bg-surface-container-low"
        style={{ aspectRatio }}
      >
        {isEnviando ? (
          <View className="flex-1 items-center justify-center gap-2">
            <ActivityIndicator color={colors.gold} />
            <Text className="font-sans text-xs text-ink-muted">Enviando…</Text>
          </View>
        ) : value ? (
          <View className="flex-1">
            <Image
              source={{ uri: value }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
            {/* Sem esse selo não há nada indicando que a imagem é tocável. */}
            <View className="absolute bottom-2 right-2 h-9 w-9 items-center justify-center rounded-full bg-gold">
              <Ionicons name="camera" size={17} color={colors.onGold} />
            </View>
          </View>
        ) : (
          <View className="flex-1 items-center justify-center gap-1.5">
            <Ionicons name="image-outline" size={30} color={colors.outline} />
            <Text className="font-sans-medium text-sm text-ink-muted">
              Toque para escolher uma imagem
            </Text>
            <Text className="font-sans text-xs text-ink-muted">
              Câmera ou galeria
            </Text>
          </View>
        )}
      </Pressable>

      {hint ? (
        <Text className="font-sans text-xs text-ink-muted">{hint}</Text>
      ) : null}
    </View>
  );
}
