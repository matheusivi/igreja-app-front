import { Image, View } from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';

/**
 * Marca do app: a menorá da igreja dentro de um distintivo arredondado.
 *
 * Aparece no topo de Login, Cadastro, Esqueci a Senha e Redefinir Senha —
 * quatro telas que a pessoa vê antes de existir sessão, e por isso as únicas
 * que precisam dizer de que igreja é o app.
 *
 * ═══ ERA UM DESENHO GEOMÉTRICO, VIROU A ARTE DE VERDADE ═══
 * Antes eram sete barras de altura crescente com uma linha embaixo — uma
 * aproximação feita antes de existir logo. Funcionava como marcador de lugar,
 * mas de longe parecia tubo de órgão, não menorá.
 *
 * Agora é a mesma arte do ícone do aplicativo. Vale mais do que estética: o
 * que a pessoa vê ao abrir o app pela primeira vez é o mesmo símbolo que ela
 * tocou na tela inicial do celular. Marca que muda entre o ícone e a primeira
 * tela faz o app parecer outro.
 *
 * ═══ POR QUE `tintColor` E NÃO UMA IMAGEM COLORIDA ═══
 * O arquivo é uma silhueta preta sobre fundo transparente, e o React Native
 * usa APENAS o canal alfa quando há `tintColor` — a cor gravada no PNG é
 * descartada. Assim um arquivo só serve aos dois temas.
 *
 * ═══ `ink`, E NÃO PRETO LITERAL ═══
 * A cor pedida foi preto. `ink` é rgb(61, 35, 23) — um marrom tão escuro que
 * ao olho é preto, e é a mesma tinta do texto do app. No distintivo bege dá
 * 11:1 de contraste, contra 4,45:1 do marrom que estava aqui antes.
 *
 * O ganho de usar o token em vez de `#000` aparece no tema escuro, onde o
 * distintivo é rgb(62, 44, 33). Ali preto literal dá **1,59:1** — a menorá
 * simplesmente desaparece, e quem usa o celular no escuro abre o app numa
 * tela sem marca nenhuma. O `ink` vira claro sozinho e mantém 10,86:1.
 *
 * Ou seja: no tema claro é exatamente o preto que você pediu; no escuro é o
 * que o preto deveria ter sido.
 */

/** 600 × 467 no arquivo. Guardado aqui para a altura sair sem distorcer. */
const PROPORCAO = 600 / 467;

/** Quanto da largura do distintivo a menorá ocupa. */
const OCUPACAO = 0.58;

type MenorahMarkProps = {
  size?: number;
};

export function MenorahMark({ size = 64 }: MenorahMarkProps) {
  const colors = useThemeColors();
  const largura = size * OCUPACAO;

  return (
    <View
      className="items-center justify-center rounded-xl bg-surface-container-high"
      style={{ width: size, height: size }}
    >
      <Image
        source={require('../../assets/menora.png')}
        style={{
          width: largura,
          height: largura / PROPORCAO,
          // Fora do `style` o TypeScript reclama: `tintColor` como propriedade
          // solta é do tipo antigo do Image.
          tintColor: colors.ink,
        }}
        resizeMode="contain"
        // A marca é decoração; o nome da igreja vem escrito logo abaixo dela.
        // Sem isto, o leitor de tela anunciaria "imagem" antes do texto que
        // realmente informa.
        accessible={false}
      />
    </View>
  );
}
