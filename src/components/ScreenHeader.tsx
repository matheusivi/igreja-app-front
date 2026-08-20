import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { tracking } from '../constants/theme';
import { useThemeColors } from '../hooks/useThemeColors';
import { Button } from './Button';

/**
 * Cabeçalho de tela de lista — DESIGN.md §9.
 *
 * ── O que mudou e por quê ─────────────────────────────────────────────
 * Era uma faixa marrom escura, repetida em sete telas. Peso repetido vira
 * monotonia, e monotonia escura vira solenidade — o oposto de "acolhedor".
 * Além disso, com a barra de abas também escura, o conteúdo ficava
 * espremido entre dois blocos pesados.
 *
 * Agora o cabeçalho é a própria página: sem faixa, sem moldura. O que
 * organiza a tela é a TIPOGRAFIA — título grande serifado — e não um bloco
 * de cor. Isso é o que dá o registro leve do Glorify sem copiar layout dele.
 *
 * A cor escura ficou reservada ao hero da Home, o único lugar do app que tem
 * foto atrás. Escuro que aparece uma vez é atmosfera; escuro que aparece sete
 * vezes é peso.
 */

type ScreenHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionIcon?: keyof typeof Ionicons.glyphMap;
  onActionPress?: () => void;
  /** Mostra a seta de voltar acima do título. */
  onBack?: () => void;
  /** Indicador discreto de sincronização em segundo plano. */
  busy?: boolean;
  /**
   * Ação como botão de ícone na linha do voltar, em vez de bloco sólido
   * abaixo do subtítulo.
   *
   * ═══ QUANDO USAR ═══
   * Em tela de ÍNDICE — uma lista onde o conteúdo é a razão da visita e
   * criar é tarefa de poucos. Ali o bloco sólido de "Novo aviso" era o
   * elemento mais forte da tela: um retângulo de terracota sozinho numa
   * linha, gritando mais alto que os avisos que ele cria. E era invisível
   * para a maioria — só liderança recebe a ação —, ou seja, a página inteira
   * estava desenhada em volta de um botão que quase ninguém vê.
   *
   * Em tela de TAREFA (Cursos, Grupos), onde criar é o motivo de estar ali,
   * o botão com rótulo continua certo. Por isso isto é opção, e não a regra.
   */
  acaoCompacta?: boolean;
  /**
   * Fio de fechamento sem ação compacta — para as telas de índice que não
   * têm nada a criar no cabeçalho, mas precisam da mesma separação.
   */
  regua?: boolean;
};

export function ScreenHeader({
  eyebrow,
  title,
  subtitle,
  actionLabel,
  actionIcon = 'add',
  onActionPress,
  onBack,
  busy = false,
  acaoCompacta = false,
  regua = false,
}: ScreenHeaderProps) {
  const colors = useThemeColors();
  const hasAction = Boolean(actionLabel && onActionPress);
  const compacta = hasAction && acaoCompacta;

  return (
    <View className="bg-background px-gutter pb-lg pt-sm">
      {onBack || busy || compacta ? (
        <View className="mb-sm h-11 flex-row items-center justify-between">
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
            <View />
          )}

          <View className="flex-row items-center gap-md">
            {busy ? <ActivityIndicator size="small" color={colors.primary} /> : null}

            {/* ═══ PÍLULA COM RÓTULO, NÃO ÍCONE SOLTO ═══
                A primeira tentativa foi um "+" sozinho num círculo. Duas
                coisas deram errado:

                1. O fundo não renderizou. O `Pressable` levava a aparência
                   num `style` de FUNÇÃO, e o NativeWind escreve o `className`
                   nesse mesmo prop — o que perde o merge some. Sobrou um "+"
                   branco sobre papel creme, quase invisível. Agora quem
                   carrega a aparência é uma `View` filha, e o `Pressable` só
                   mexe na opacidade.

                2. Ícone sozinho é economia de espaço paga com clareza. Numa
                   tela que a liderança abre uma vez por semana, a memória de
                   "aquele mais ali em cima cria" não se forma. O rótulo custa
                   50px de largura e devolve a descoberta. */}
            {compacta ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={actionLabel}
                onPress={onActionPress}
                hitSlop={8}
                style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
              >
                <View
                  style={{
                    height: 40,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: 14,
                    borderRadius: 20,
                    backgroundColor: colors.primary,
                  }}
                >
                  <Ionicons name={actionIcon} size={18} color={colors.onPrimary} />
                  <Text
                    className="font-sans-semibold text-[14px]"
                    style={{ color: colors.onPrimary }}
                  >
                    Novo
                  </Text>
                </View>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}

      {eyebrow ? (
        <Text
          className="font-sans-semibold text-[11px] uppercase text-secondary"
          // Tracking positivo em versalete pequeno: sem ele, 11px em caixa
          // alta vira um borrão. É o oposto do que o título grande precisa.
          style={{ letterSpacing: tracking.overline }}
        >
          {eyebrow}
        </Text>
      ) : null}

      {/* 26px serifado com tracking NEGATIVO. O espaçamento entre letras da
          Source Serif foi desenhado para corpo de texto; em 26px ele vira
          buraco. Sem esta correção o título parece grande, não desenhado —
          e é justamente esse detalhe que separa tipografia com personalidade
          de "aumentei a fonte". */}
      <Text
        accessibilityRole="header"
        className="mt-xs font-serif-bold text-[26px] leading-8 text-ink"
        style={{ letterSpacing: tracking.title }}
      >
        {title}
      </Text>

      {subtitle ? (
        <Text className="mt-xs max-w-[92%] font-sans text-sm leading-5 text-ink-muted">
          {subtitle}
        </Text>
      ) : null}

      {/* Fio de fechamento do cabeçalho.
          Sem ele, título e conteúdo ficavam no mesmo papel, sem nada dizendo
          onde um termina e o outro começa — a página era um bloco só de cima
          a baixo. Um fio de 1px em `outline-variant` dá 1,33:1 contra o
          papel: o olho lê a aresta, não a linha. Régua de 3:1 viraria moldura,
          e moldura em toda tela é o que denuncia template. */}
      {acaoCompacta || regua ? <View className="mt-lg h-px bg-outline-variant" /> : null}

      {hasAction && !acaoCompacta ? (
        <View className="mt-lg flex-row">
          <Button
            label={actionLabel!}
            size="sm"
            fullWidth={false}
            icon={<Ionicons name={actionIcon} size={17} color={colors.onPrimary} />}
            onPress={onActionPress!}
          />
        </View>
      ) : null}
    </View>
  );
}
