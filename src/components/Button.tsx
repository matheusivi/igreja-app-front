import { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';
import { radius } from '../constants/theme';
import { useThemeColors } from '../hooks/useThemeColors';

/**
 * Botão — DESIGN.md §6.
 *
 * ═══ DECISÕES ═══
 *
 * **Raio 5px, não 8 nem 12.** Os dois valores mais usados por interface
 * gerada são exatamente 8 e 12; 10, que era o valor anterior daqui, fica no
 * meio e não se distingue de nenhum dos dois. 5px é aresta viva: lê como
 * papel cortado, conversa com a serifada da marca e é imediatamente outra
 * coisa. Também endurece a regra de aninhamento — 5 (botão) < 10 (chip) <
 * 16 (card) < 24 (superfície imersiva).
 *
 * **A presença do primário vem de uma ARESTA, não de sombra.** Sombra suave
 * embaixo de botão é a assinatura visual de template. Aqui o primário tem
 * 2px de `primary-edge` (o mesmo terracota, 20% mais escuro) na borda de
 * baixo — a leitura é de objeto com espessura, não de objeto flutuando. Ao
 * pressionar, a aresta some e o botão desce 2px: o dedo "afunda" a peça.
 * É feedback físico sem animação, sem biblioteca e sem sombra.
 *
 * **Secundário e outline são subordinados por MASSA, não por cor.** O
 * primário é uma área sólida saturada; o secundário é uma área de tinta
 * quase imperceptível (`surface-dim`); o outline é só contorno. Peso visual
 * decrescente sem precisar mudar o tamanho do texto.
 *
 * **Destrutivo nunca é preenchido.** Vermelho sólido e grande atrai o toque
 * justamente para a ação sem volta. Ele fica visível e nomeado, e nunca é o
 * elemento mais pesado da tela.
 *
 * **Tracking positivo de 0,2 no rótulo.** Sans-serif em 15px semibold fecha
 * demais em tela densa. É pouco, e é o que faz o rótulo parecer assentado
 * dentro do botão em vez de espremido.
 *
 * ═══ TOKENS ═══
 * cor      primary · primary-edge · on-primary · surface-dim · ink ·
 *          outline · secondary · error
 * raio     radius.button (5)
 * altura   48 (md) · 40 (sm)
 * texto    sans-semibold 15px / tracking +0.2
 *
 * ═══ USO ═══
 * <Button label="Criar turma" onPress={...} />                        // uma por tela
 * <Button label="Ver na agenda" variant="secondary" onPress={...} />
 * <Button label="Cancelar" variant="outline" onPress={...} />
 * <Button label="Saiba mais" variant="ghost" onPress={...} />
 * <Button label="Excluir curso" variant="destructive" onPress={...} />
 */

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type ButtonSize = 'md' | 'sm';

type ButtonProps = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
};

const variantClasses: Record<ButtonVariant, { container: string; text: string }> = {
  primary: { container: 'bg-primary', text: 'text-on-primary' },
  secondary: { container: 'bg-surface-dim', text: 'text-ink' },
  outline: { container: 'bg-transparent border border-outline', text: 'text-ink' },
  ghost: { container: 'bg-transparent', text: 'text-secondary' },
  destructive: { container: 'bg-transparent border border-error', text: 'text-error' },
};

function corDoConteudo(variant: ButtonVariant, colors: ReturnType<typeof useThemeColors>) {
  if (variant === 'primary') return colors.onPrimary;
  if (variant === 'destructive') return colors.error;
  if (variant === 'ghost') return colors.secondary;
  return colors.ink;
}

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  fullWidth = true,
  disabled,
  ...pressableProps
}: ButtonProps) {
  const colors = useThemeColors();
  const isDisabled = disabled || loading;
  const { container, text } = variantClasses[variant];
  const temAresta = variant === 'primary' && !isDisabled;

  /**
   * 52, não 48.
   *
   * O `minHeight` sozinho estava entregando um botão que MEDIA certo e
   * PARECIA fino: 48pt de altura com rótulo de 15px numa barra que ocupa a
   * largura toda dá uma proporção de ~1:7, e nessa proporção o olho lê faixa,
   * não botão. Botão largo precisa de mais altura que botão estreito para
   * manter a mesma leitura — é proporção, não acessibilidade.
   *
   * A altura entra também por `className` (`min-h-*`): o NativeWind resolve
   * `className` para `style`, e quando as duas fontes disputam a mesma
   * propriedade o resultado depende da ordem de merge. Declarar nos dois
   * lugares tira a ambiguidade.
   */
  const altura = size === 'sm' ? 44 : 52;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: loading }}
      disabled={isDisabled}
      className={[
        'flex-row items-center justify-center gap-2',
        size === 'sm' ? 'min-h-[44px] px-lg' : 'min-h-[52px] px-xl',
        container,
        fullWidth ? 'w-full' : '',
        isDisabled ? 'opacity-40' : '',
      ].join(' ')}
      style={({ pressed }) => [
        {
          minHeight: altura,
          borderRadius: radius.button,
          // A aresta ocupa espaço: sem o padding compensatório o rótulo sobe
          // 2px em relação ao centro óptico quando o botão é primário.
          borderBottomWidth: temAresta ? 2 : 0,
          borderBottomColor: colors.primaryEdge,
          paddingTop: temAresta ? 2 : 0,
        },
        pressed && !isDisabled
          ? {
              // A aresta colapsa e a peça desce a mesma altura: o dedo afunda
              // o botão, e a caixa não muda de tamanho no meio do toque.
              borderBottomWidth: 0,
              paddingTop: temAresta ? 4 : 2,
              opacity: 0.92,
            }
          : null,
      ]}
      {...pressableProps}
    >
      {loading ? (
        <ActivityIndicator size="small" color={corDoConteudo(variant, colors)} />
      ) : (
        icon
      )}
      <Text
        className={[
          'font-sans-semibold',
          size === 'sm' ? 'text-sm' : 'text-base',
          text,
        ].join(' ')}
        style={{ letterSpacing: 0.2 }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
