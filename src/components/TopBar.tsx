import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';

/**
 * Barra de topo compacta — para telas de DETALHE e de FORMULÁRIO.
 *
 * Convive com o `ScreenHeader` por escolha, não por descuido:
 *
 * - `ScreenHeader` (faixa alta, com sobretítulo e subtítulo) é das telas de
 *   lista e das abas. Ali a pessoa está chegando e precisa saber onde entrou.
 * - `TopBar` (uma linha de 56px) é de quem já sabe onde está e veio ler um
 *   conteúdo ou preencher um formulário. Nessas telas cada pixel vertical
 *   disputa espaço com o teclado — uma faixa alta ali só empurra o campo
 *   para fora da tela.
 *
 * O que muda em relação à barra que estava copiada à mão em 15 arquivos:
 *
 * - Fundo `header` em vez de `background`. Assim toda tela do app tem o topo
 *   e a barra de abas da mesma cor, e o conteúdo fica claramente entre os dois.
 * - Ícones de 24px com `hitSlop={12}` = alvo de 48px. Antes eram 20–22px com
 *   `hitSlop={8}`, ou seja, 36–38px — abaixo dos 44 que a regra pede.
 * - `accessibilityLabel` obrigatório na ação da direita. Um ícone sozinho não
 *   diz nada para o leitor de tela, e na maioria das cópias ele faltava.
 */

type TopBarProps = {
  title: string;
  onBack?: () => void;
  actionIcon?: keyof typeof Ionicons.glyphMap;
  /** Obrigatório junto com `actionIcon`: é o que o leitor de tela anuncia. */
  actionLabel?: string;
  onActionPress?: () => void;
};

export function TopBar({
  title,
  onBack,
  actionIcon,
  actionLabel,
  onActionPress,
}: TopBarProps) {
  const colors = useThemeColors();
  const hasAction = Boolean(actionIcon && actionLabel && onActionPress);

  return (
    <View className="h-14 flex-row items-center justify-between bg-background px-gutter">
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          onPress={onBack}
          hitSlop={12}
          style={({ pressed }) => pressed && { opacity: 0.6 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </Pressable>
      ) : (
        // Espaçador do mesmo tamanho do ícone: sem ele o título perde o
        // centro quando a tela não tem seta de voltar.
        <View style={{ width: 24 }} />
      )}

      {/* ═══ TÍTULO VAZIO É UMA OPÇÃO ═══
          Em tela de DETALHE, o conteúdo já abre com o nome em 30px. Repetir
          esse nome aqui, cem pixels acima, é dizer a mesma coisa duas vezes —
          e a versão de cima ainda é a pior das duas, truncada em uma linha.

          Passando `title=""`, a barra fica só com o voltar e a ação, e o
          espaçador mantém o alinhamento. É o padrão das telas de detalhe:
          a barra navega, o conteúdo se apresenta. */}
      {title ? (
        <Text
          accessibilityRole="header"
          numberOfLines={1}
          className="flex-1 px-3 text-center font-serif-bold text-base text-ink"
        >
          {title}
        </Text>
      ) : (
        <View className="flex-1" />
      )}

      {hasAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onActionPress}
          hitSlop={12}
          style={({ pressed }) => pressed && { opacity: 0.6 }}
        >
          {/* `primary` e não `gold`: o dourado dá 2,75:1 sobre o papel e
              reprova até como ícone (o mínimo para elemento gráfico é 3:1). */}
          <Ionicons name={actionIcon!} size={24} color={colors.primary} />
        </Pressable>
      ) : (
        <View style={{ width: 24 }} />
      )}
    </View>
  );
}
