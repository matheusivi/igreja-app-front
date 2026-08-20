import { Text, View } from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';
import { Avatar } from './Avatar';

/**
 * Rostos sobrepostos — quem são as pessoas, e não quantas.
 *
 * ═══ POR QUE ISTO EXISTE ═══
 * O card do grupo dizia "Criado por Fulano" com um avatar de 40px e, embaixo,
 * "7 membros participando". Duas informações administrativas sobre um grupo
 * FAMILIAR: quem abriu o registro, e um número.
 *
 * Quem abriu o registro é a coisa menos relevante depois do primeiro dia. E
 * "7 membros" é contabilidade — não faz ninguém reconhecer a própria família.
 * Quatro rostos fazem, na hora, sem ler nada. Grupo familiar é gente; a tela
 * tem que mostrar gente.
 *
 * ═══ O ANEL ═══
 * Cada avatar tem uma borda da cor da SUPERFÍCIE em que está pousado. Sem
 * ela, discos sobrepostos com fotos escuras viram uma mancha só — o anel é o
 * que faz o olho separar um rosto do seguinte. Por isso a cor do anel é
 * parâmetro: num card branco ela é branca, num card escuro é a do card.
 */

const SOBREPOSICAO = 10;

export function PilhaAvatares({
  pessoas,
  tamanho = 32,
  maximo = 4,
  corDoAnel,
}: {
  pessoas: { id: number; nomeCompleto: string; fotoUrl: string | null }[];
  tamanho?: number;
  /** Acima disto, o excedente vira "+N". */
  maximo?: number;
  corDoAnel?: string;
}) {
  const colors = useThemeColors();
  const anel = corDoAnel ?? colors.surfaceBright;

  if (pessoas.length === 0) return null;

  const visiveis = pessoas.slice(0, maximo);
  const excedente = pessoas.length - visiveis.length;

  return (
    <View
      className="flex-row items-center"
      // Um alvo só para o leitor de tela: quatro fotos anunciadas uma a uma
      // seriam quatro paradas para dizer a mesma coisa.
      accessible
      accessibilityLabel={
        pessoas.length === 1
          ? pessoas[0]!.nomeCompleto
          : `${pessoas.length} pessoas, incluindo ${visiveis
              .map((p) => p.nomeCompleto.split(' ')[0])
              .join(', ')}`
      }
    >
      {visiveis.map((pessoa, i) => (
        <View
          key={pessoa.id}
          style={{
            marginLeft: i === 0 ? 0 : -SOBREPOSICAO,
            borderRadius: (tamanho + 4) / 2,
            borderWidth: 2,
            borderColor: anel,
            backgroundColor: anel,
            // Os primeiros por cima: a pilha "cresce" para a direita e para
            // trás, como cartas na mão.
            zIndex: visiveis.length - i,
          }}
        >
          <Avatar nome={pessoa.nomeCompleto} fotoUrl={pessoa.fotoUrl} size={tamanho} />
        </View>
      ))}

      {excedente > 0 ? (
        <View
          style={{
            marginLeft: -SOBREPOSICAO,
            width: tamanho + 4,
            height: tamanho + 4,
            borderRadius: (tamanho + 4) / 2,
            borderWidth: 2,
            borderColor: anel,
            backgroundColor: colors.surfaceDim,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            className="font-sans-semibold text-ink-muted"
            style={{ fontSize: Math.max(11, tamanho * 0.34) }}
          >
            +{excedente}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
