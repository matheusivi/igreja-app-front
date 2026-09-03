import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { FRASE_ABERTURA, NOME_IGREJA } from '../constants/igreja';

/**
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║  A TELA DE ABERTURA                                                   ║
 * ╚═══════════════════════════════════════════════════════════════════════╝
 *
 * ═══ SÃO DUAS TELAS, E CADA UMA DIZ UMA COISA ═══
 * Ao tocar no ícone, o Android mostra uma tela sua antes de existir
 * JavaScript — é o sistema preenchendo o intervalo até o app carregar, e não
 * há como pular. Ela mostra a MENORÁ.
 *
 * Esta aqui é a segunda, e não repete o símbolo: ela traz a PALAVRA. Primeiro
 * a igreja se identifica, depois ela diz alguma coisa.
 *
 * Tentamos antes repetir a menorá nas duas para esconder a emenda. Não
 * funcionou: repetição chama atenção justamente para o que se quer disfarçar.
 * Duas telas com conteúdos diferentes leem como sequência; duas telas com o
 * mesmo conteúdo leem como falha.
 *
 * O fundo é o mesmo dos dois lados (`backgroundColor` no app.json bate com o
 * `--color-background` do tema), então não há salto de cor — só o símbolo
 * dando lugar ao texto.
 *
 * ═══ POR QUE A FRASE VEM PALAVRA POR PALAVRA ═══
 * Escrita de uma vez, o olho a lê em meio segundo e o resto vira espera.
 * Revelada aos poucos, o tempo de carregamento vira o tempo da frase: em vez
 * de esperar o app, a pessoa acompanha uma ideia sendo dita.
 *
 * Só opacidade — sem subir, sem saltar. Palavra que entra deslizando chama
 * atenção para si; aqui ela deve chamar atenção para o que está escrito.
 */

/** Quando o nome da igreja começa a surgir. Curto: a tela precisa reagir. */
const ATRASO_NOME = 120;

/** Quando a primeira palavra entra. */
const ATRASO_PRIMEIRA_PALAVRA = 380;
const INTERVALO_PALAVRA = 190;
const DURACAO_PALAVRA = 560;

/** Respiro depois da última palavra, antes de abrir o app. */
const RESPIRO_FINAL = 560;

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
      <Animated.Text
        entering={FadeIn.delay(ATRASO_NOME).duration(520)}
        className="mb-md font-sans-semibold text-xs uppercase tracking-wide text-ink-muted"
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
        className="max-w-[320px] flex-row flex-wrap justify-center px-gutter"
      >
        {FRASE_ABERTURA.map((palavra, i) => (
          <Animated.Text
            key={palavra + i}
            entering={FadeIn.delay(
              ATRASO_PRIMEIRA_PALAVRA + i * INTERVALO_PALAVRA,
            ).duration(DURACAO_PALAVRA)}
            className="font-serif text-[22px] leading-9 text-ink"
          >
            {palavra}
            {i < FRASE_ABERTURA.length - 1 ? ' ' : ''}
          </Animated.Text>
        ))}
      </View>
    </Animated.View>
  );
}
