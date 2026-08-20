import { Text, View } from 'react-native';
import { tracking } from '../constants/theme';
import { useThemeColors } from '../hooks/useThemeColors';

/**
 * Iniciais serifadas para quem ainda não subiu foto.
 *
 * ═══ A DECISÃO ═══
 * Este não é um "estado de imagem faltando" — é um DESENHO. A diferença é
 * inteira: um placeholder cinza com iniciais diz "está incompleto"; um
 * monograma tipográfico grande sobre fundo tingido diz "é assim mesmo".
 *
 * Como o app ainda não está em produção e a maioria dos membros não tem foto,
 * este componente vai aparecer mais que a foto de verdade no começo. Ele
 * precisa aguentar ser o estado PADRÃO, não o de exceção — daí a serifada da
 * marca em corpo grande, e não uma inicial de 14px num círculo cinza.
 *
 * ═══ A COR ═══
 * O tom de fundo é escolhido pelo NOME, não sorteado. Duas consequências:
 * a mesma pessoa tem sempre o mesmo tom (o olho começa a reconhecer antes de
 * ler), e a tela não pisca de cor a cada renderização.
 *
 * São quatro tons, todos da paleta. Mais que isso vira mostruário; menos, e
 * dois cards vizinhos ficam iguais com frequência alta demais.
 */

/** Índice estável a partir do nome — mesma pessoa, mesmo tom, sempre. */
function tomDoNome(nome: string, total: number): number {
  let soma = 0;
  for (let i = 0; i < nome.length; i += 1) soma += nome.charCodeAt(i);
  return soma % total;
}

/**
 * Primeira letra do primeiro nome e do último sobrenome.
 *
 * "de", "da", "dos" são ignorados: "Maria da Silva" precisa dar MS, não MD.
 */
export function iniciaisDe(nomeCompleto: string): string {
  const partes = nomeCompleto
    .trim()
    .split(/\s+/)
    .filter((p) => !['de', 'da', 'do', 'das', 'dos', 'e'].includes(p.toLowerCase()));

  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0]!.charAt(0).toUpperCase();
  return (partes[0]!.charAt(0) + partes.at(-1)!.charAt(0)).toUpperCase();
}

type Props = {
  nome: string;
  /** Corpo da fonte. O contêiner deve ser preenchido por quem usa. */
  tamanho?: number;
};

export function Monograma({ nome, tamanho = 64 }: Props) {
  const colors = useThemeColors();

  const tons = [
    { fundo: colors.goldFixed, tinta: colors.onGoldFixed },
    { fundo: colors.surfaceContainerHigh, tinta: colors.ink },
    { fundo: colors.goldSoft, tinta: colors.onGold },
    { fundo: colors.successSoft, tinta: colors.ink },
  ];
  const tom = tons[tomDoNome(nome, tons.length)]!;

  return (
    <View
      // `absoluteFill` não serve aqui: quem usa decide o tamanho da caixa.
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: tom.fundo,
      }}
    >
      <Text
        // `accessible={false}`: o nome completo já é lido em seguida, e
        // anunciar "M S" antes dele só atrapalha quem ouve.
        accessible={false}
        style={{
          fontFamily: 'SourceSerif4_700Bold',
          fontSize: tamanho,
          lineHeight: tamanho * 1.2,
          color: tom.tinta,
          letterSpacing: tracking.display,
        }}
      >
        {iniciaisDe(nome)}
      </Text>
    </View>
  );
}
