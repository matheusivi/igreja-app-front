import { useEffect } from 'react';
import { Image, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { FRASE_ABERTURA, NOME_IGREJA } from '../constants/igreja';
import { useThemeColors } from '../hooks/useThemeColors';

/**
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║  A TELA DE ABERTURA                                                   ║
 * ╚═══════════════════════════════════════════════════════════════════════╝
 *
 * ═══ POR QUE ELA IMITA A TELA NATIVA ═══
 * O Android mostra uma tela sua antes de o JavaScript existir — não há como
 * evitar, é o sistema preenchendo o intervalo entre tocar no ícone e o app
 * carregar. Depois dela vem esta, e a troca aparecia como um piscar de duas
 * telas diferentes.
 *
 * A solução não é remover uma: é fazer as duas serem a MESMA imagem. A tela
 * nativa (configurada em `app.json`) mostra a menorá na cor primária, no mesmo
 * fundo e no mesmo tamanho com que ela nasce aqui. Quando o JavaScript assume,
 * o desenho já está na tela e não se mexe — só a frase começa a aparecer
 * embaixo dele.
 *
 * ⚠️  Mudar o tamanho ou a cor aqui exige mudar o `imageWidth` e o
 * `backgroundColor` no `app.json` junto. Divergiram, volta o piscar.
 *
 * ═══ POR QUE A FRASE APARECE PALAVRA POR PALAVRA ═══
 * Escrita de uma vez, o olho a lê em meio segundo e o resto vira espera.
 * Revelada aos poucos, o tempo de carregamento vira o tempo da frase: em vez
 * de esperar o app, a pessoa acompanha uma ideia sendo dita.
 *
 * O movimento é só opacidade — sem subir, sem saltar. Palavra que entra
 * deslizando chama atenção para si; aqui ela deve chamar atenção para o que
 * está escrito.
 */

/** Precisa bater com `imageWidth` do expo-splash-screen no `app.json`. */
const LARGURA_MARCA = 190;

/** Proporção do arquivo: 560 × 436. */
const PROPORCAO_MARCA = 560 / 436;

/** Quanto tempo entre uma palavra e a seguinte. */
const INTERVALO_PALAVRA = 200;

/** Quando a primeira palavra entra. */
const ATRASO_PRIMEIRA_PALAVRA = 420;

/** Cada palavra leva este tempo para surgir por completo. */
const DURACAO_PALAVRA = 620;

/** Respiro depois da última palavra, antes de abrir o app. */
const RESPIRO_FINAL = 620;

const DURACAO_MINIMA =
  ATRASO_PRIMEIRA_PALAVRA +
  (FRASE_ABERTURA.length - 1) * INTERVALO_PALAVRA +
  DURACAO_PALAVRA +
  RESPIRO_FINAL;

type Props = {
  /** Chamado quando a animação terminou. Não significa que o app carregou. */
  aoTerminar: () => void;
};

export function TelaDeAbertura({ aoTerminar }: Props) {
  const colors = useThemeColors();

  useEffect(() => {
    const t = setTimeout(aoTerminar, DURACAO_MINIMA);
    return () => clearTimeout(t);
  }, [aoTerminar]);

  return (
    <Animated.View
      // A saída é do container inteiro: a tela toda se dissolve na do app, em
      // vez de os elementos sumirem um a um. Fim de cena, não desmontagem.
      exiting={FadeOut.duration(380)}
      className="flex-1 items-center justify-center bg-background"
    >
      {/*
        SEM animação de entrada, de propósito. Esta imagem é a continuação
        exata da tela nativa — ela já estava ali. Fazê-la aparecer de novo
        anunciaria justamente a troca que queremos esconder.
      */}
      <Image
        source={require('../../assets/splash-icon.png')}
        style={{
          width: LARGURA_MARCA,
          height: LARGURA_MARCA / PROPORCAO_MARCA,
          // O arquivo é uma silhueta; a cor vem do tema. Um só desenho serve
          // ao claro e ao escuro.
          tintColor: colors.primary,
        }}
        resizeMode="contain"
        accessible={false}
      />

      <Animated.Text
        entering={FadeIn.delay(200).duration(600)}
        className="mt-lg font-sans-semibold text-xs uppercase tracking-wide text-ink-muted"
      >
        {NOME_IGREJA}
      </Animated.Text>

      {/*
        ═══ ACESSIBILIDADE: A FRASE É UMA SÓ ═══
        Para o leitor de tela, este bloco é UM texto. Sem isso ele anunciaria
        cinco fragmentos soltos, com pausa entre cada um, enquanto ainda
        aparecem. A quebra em palavras é recurso visual; ninguém precisa
        ouvi-la.
      */}
      <View
        accessible
        accessibilityRole="text"
        accessibilityLabel={FRASE_ABERTURA.join(' ')}
        className="mt-md max-w-[320px] flex-row flex-wrap justify-center px-gutter"
      >
        {FRASE_ABERTURA.map((palavra, i) => (
          <Animated.Text
            key={palavra + i}
            // Só opacidade, e devagar. O atraso crescente cria a cadência de
            // fala sem que nada se desloque na tela.
            entering={FadeIn.delay(
              ATRASO_PRIMEIRA_PALAVRA + i * INTERVALO_PALAVRA,
            ).duration(DURACAO_PALAVRA)}
            className="font-serif text-[21px] leading-8 text-ink"
          >
            {palavra}
            {i < FRASE_ABERTURA.length - 1 ? ' ' : ''}
          </Animated.Text>
        ))}
      </View>
    </Animated.View>
  );
}
