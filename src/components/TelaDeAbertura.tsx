import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';

import { FRASE_ABERTURA, NOME_IGREJA } from '../constants/igreja';
import { MenorahMark } from './MenorahMark';

/**
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║  A TELA DE ABERTURA                                                   ║
 * ╚═══════════════════════════════════════════════════════════════════════╝
 *
 * Antes eram três segundos de uma rodinha girando. Funcional e mudo.
 *
 * ═══ POR QUE A FRASE APARECE PALAVRA POR PALAVRA ═══
 * Escrita de uma vez, ela seria só um texto no meio da tela — o olho lê em
 * meio segundo e sobra espera. Revelada aos poucos, o tempo de carregamento
 * vira o tempo da frase: em vez de esperar o app, a pessoa acompanha uma ideia
 * sendo dita.
 *
 * É o mesmo intervalo. O que muda é o que ele significa.
 *
 * ═══ POR QUE UM TEMPO MÍNIMO ═══
 * Quem já entrou uma vez tem a sessão guardada no aparelho, e o carregamento
 * dura milissegundos. Sem o mínimo, a frase seria cortada no meio quase
 * sempre — pior do que não existir, porque piscaria.
 *
 * `DURACAO_MINIMA` é calculado a partir da própria frase: acrescentar uma
 * palavra em `FRASE_ABERTURA` estica a abertura sozinho, sem ninguém precisar
 * lembrar de ajustar um número aqui.
 */

/** Quando a menorá começa a aparecer. */
const ATRASO_MARCA = 120;

/** Quanto tempo entre uma palavra e a seguinte. */
const INTERVALO_PALAVRA = 170;

/** Quando a primeira palavra entra — depois da marca ter se assentado. */
const ATRASO_PRIMEIRA_PALAVRA = 620;

/** Respiro depois da última palavra, antes de abrir o app. */
const RESPIRO_FINAL = 520;

const DURACAO_MINIMA =
  ATRASO_PRIMEIRA_PALAVRA +
  FRASE_ABERTURA.length * INTERVALO_PALAVRA +
  RESPIRO_FINAL;

type Props = {
  /** Chamado quando a animação terminou. Não significa que o app carregou. */
  aoTerminar: () => void;
};

export function TelaDeAbertura({ aoTerminar }: Props) {
  useEffect(() => {
    const t = setTimeout(aoTerminar, DURACAO_MINIMA);
    return () => clearTimeout(t);
  }, [aoTerminar]);

  return (
    <Animated.View
      // A saída é do container inteiro: a tela toda se dissolve na do app, em
      // vez de os elementos sumirem um a um. Fim de cena, não desmontagem.
      exiting={FadeOut.duration(320)}
      className="flex-1 items-center justify-center gap-xl bg-background"
    >
      <Animated.View
        // A marca cresce um pouco ao entrar. Sutil de propósito: precisa
        // parecer que ela se acomodou, não que saltou.
        entering={FadeIn.delay(ATRASO_MARCA).duration(560)}
      >
        <MenorahMark size={96} />
      </Animated.View>

      <Animated.Text
        entering={FadeIn.delay(ATRASO_MARCA + 220).duration(480)}
        className="font-sans-semibold text-xs uppercase tracking-wide text-ink-muted"
      >
        {NOME_IGREJA}
      </Animated.Text>

      {/*
        ═══ A FRASE ═══
        Serifada e grande, porque é a única coisa aqui para ser LIDA — o resto
        é identidade. `flex-wrap` deixa a linha quebrar sozinha em aparelho
        estreito, sem que ninguém precise decidir onde.
      */}
      {/*
        ═══ ACESSIBILIDADE: A FRASE É UMA SÓ ═══
        Para o leitor de tela, o container inteiro é UM texto — a frase
        completa. Sem isso ele anunciaria cinco fragmentos soltos, com pausa
        entre cada um, enquanto eles ainda estão aparecendo. A quebra em
        palavras é recurso visual; ninguém precisa ouvi-la.
      */}
      <View
        accessible
        accessibilityRole="text"
        accessibilityLabel={FRASE_ABERTURA.join(' ')}
        className="max-w-[300px] flex-row flex-wrap justify-center px-gutter"
      >
        {FRASE_ABERTURA.map((palavra, i) => (
          <Animated.Text
            key={palavra + i}
            // Cada palavra sobe um pouco ao entrar, na ordem da leitura.
            // O atraso crescente é o que cria o ritmo de fala.
            entering={FadeInDown.delay(
              ATRASO_PRIMEIRA_PALAVRA + i * INTERVALO_PALAVRA,
            )
              .duration(420)
              .springify()
              .damping(18)}
            className="font-serif text-[22px] leading-8 text-ink"
          >
            {palavra}
            {i < FRASE_ABERTURA.length - 1 ? ' ' : ''}
          </Animated.Text>
        ))}
      </View>

      {/*
        Sem indicador de carregamento. A frase já ocupa a espera, e uma rodinha
        girando ao lado dela diria "aguarde" bem no momento em que se está
        tentando dizer outra coisa.

        Se um dia o carregamento passar de uns quatro segundos — servidor fora
        do ar, rede ruim —, aí vale acrescentar um sinal. Hoje não passa.
      */}
    </Animated.View>
  );
}
