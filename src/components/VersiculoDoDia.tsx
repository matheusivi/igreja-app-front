import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { radius, spacing } from '../constants/theme';
import { useVersiculoDoDia } from '../hooks/useVersiculoDoDia';
import { useThemeColors } from '../hooks/useThemeColors';

/**
 * O versículo do dia, na Home.
 *
 * ═══ POR QUE ELE PODE SER FECHADO ═══
 * Quem já leu não precisa vê-lo em cada uma das oito visitas que faz à Home
 * naquele dia — e conteúdo que não sai do caminho depois de cumprido deixa de
 * ser conteúdo e vira mobília. O X devolve o controle sem custo: some hoje,
 * volta amanhã com outro texto.
 *
 * ═══ POR QUE NÃO É UM ALERTA ═══
 * Sem sombra, sem borda de destaque, sem ícone de aviso. É leitura, não
 * notificação. A tinta é a do papel, e o que distingue o card é a barra
 * dourada à esquerda — a mesma convenção de citação que qualquer leitor
 * reconhece sem legenda.
 *
 * ═══ POR QUE NÃO ESTÁ NO HERO ═══
 * O topo já tem uma frase, definida pela liderança — a identidade da igreja,
 * que muda algumas vezes por ano. Este muda todo dia e pode ser dispensado.
 * Juntar os dois faria a pessoa fechar a frase da igreja sem querer, e um
 * texto que é o topo da tela não tem como sumir sem deixar buraco.
 */
export function VersiculoDoDia() {
  const colors = useThemeColors();
  const { versiculo, visivel, dispensar } = useVersiculoDoDia();

  // `null` = o disco ainda não respondeu. Nada é desenhado: assumir visível
  // faria o card piscar e sumir quando já estivesse dispensado.
  if (!visivel) return null;

  return (
    <View
      className="mx-gutter flex-row gap-md p-lg"
      style={{
        borderRadius: radius.lg,
        // ═══ NÃO É `surfaceContainerLow` ═══
        // Era, e media 1,01:1 contra o papel da Home no tema claro — #F7F2EA
        // sobre #F7F3EE. Na prática o card não existia: o texto flutuava
        // solto, sem nada dizendo onde ele começa e termina.
        //
        // `surfaceContainerHigh` dá 1,14:1 e 1,32:1. Continua discreto (é
        // leitura, não alerta), e o filete de contorno fecha a forma para o
        // caso de a tela estar num brilho baixo, onde 1,14 some.
        backgroundColor: colors.surfaceContainerHigh,
        borderWidth: 1,
        borderColor: colors.outlineVariant,
        // Barra de citação. Quatro pixels: o suficiente para o olho ler
        // "isto é uma citação", pouco o bastante para não virar decoração.
        //
        // ═══ NÃO É DOURADA ═══
        // Era, e media 2,72:1 sobre este fundo no tema claro — abaixo do piso
        // de 3:1 para elemento gráfico que carrega significado. É a QUARTA vez
        // neste app que o dourado reprova quando sai do papel de fundo
        // tingido: ele é cor de superfície, não de traço sobre claro.
        //
        // `secondary` dá 6,00:1 e 7,51:1, e ainda amarra a barra à referência
        // logo abaixo, que usa a mesma tinta.
        borderLeftWidth: 4,
        borderLeftColor: colors.secondary,
      }}
    >
      <View className="flex-1 gap-sm">
        {/* Em data comemorativa o rótulo vira o nome dela — "Natal do Senhor"
            diz mais do que repetir "Versículo do dia" num 25 de dezembro. A
            tinta muda junto: essas datas são poucas no ano, e um destaque que
            aparece sete vezes não vicia o olho. */}
        <Text
          className="font-sans-semibold text-[11px] uppercase tracking-wide"
          style={{ color: versiculo.ocasiao ? colors.secondary : colors.inkMuted }}
        >
          {versiculo.ocasiao ?? 'Versículo do dia'}
        </Text>

        {/* Serifada e em itálico: é palavra citada, não texto do app. A
            distinção tipográfica evita ter que escrever aspas, que num bloco
            desta largura ficariam órfãs na quebra de linha. */}
        <Text
          className="font-serif text-[16px] italic leading-6"
          style={{ color: colors.ink }}
        >
          {versiculo.texto}
        </Text>

        <Text
          className="font-sans-semibold text-[13px]"
          style={{ color: colors.secondary }}
        >
          {versiculo.referencia}
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Esconder o versículo de hoje"
        accessibilityHint="Some até amanhã"
        onPress={dispensar}
        // O ícone tem 18; o `hitSlop` leva o alvo a 44. Fechar não pode exigir
        // pontaria — e um X pequeno demais faz a pessoa acertar o card e
        // navegar para outro lugar sem querer.
        hitSlop={{ top: 13, bottom: 13, left: 13, right: 13 }}
        style={({ pressed }) => ({
          opacity: pressed ? 0.5 : 1,
          alignSelf: 'flex-start',
          marginTop: -spacing.xs,
        })}
      >
        <MaterialCommunityIcons name="close" size={18} color={colors.inkMuted} />
      </Pressable>
    </View>
  );
}
