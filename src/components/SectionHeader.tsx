import { Pressable, Text, View } from 'react-native';

/**
 * Cabeçalho de seção — título serif + subtítulo sans, com link opcional
 * ("Ver tudo"). Usado em quase toda tela do app (Home, Cursos, Devocionais,
 * Eventos); antes cada tela reimplementava essa combinação com espaçamento
 * e tamanho levemente diferentes.
 */

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  actionLabel,
  onActionPress,
}: SectionHeaderProps) {
  return (
    <View className="mb-md gap-1">
      <View className="flex-row items-end justify-between">
        <View className="flex-1 gap-1 pr-4">
          {eyebrow ? (
            <Text className="font-sans-semibold text-xs uppercase tracking-wide text-secondary">
              {eyebrow}
            </Text>
          ) : null}
          <Text className="font-serif-bold text-2xl text-ink">{title}</Text>
        </View>
        {actionLabel && onActionPress ? (
          <Pressable accessibilityRole="button" onPress={onActionPress} hitSlop={8}>
            <Text className="font-sans-medium text-sm text-secondary">{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
      {subtitle ? (
        <Text className="font-sans text-sm leading-5 text-ink-muted">{subtitle}</Text>
      ) : null}
    </View>
  );
}
