import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import {
  chaveDeHoje,
  versiculoDoDia,
  type Versiculo,
} from '../constants/versiculosDoDia';

/**
 * Guarda o DIA em que a pessoa fechou o versículo — não um booleano.
 *
 * ═══ POR QUE A DATA, E NÃO "ESCONDIDO: SIM" ═══
 * Com booleano seria preciso alguém apagá-lo à meia-noite: um temporizador que
 * não roda com o app fechado, ou uma verificação no boot que erra se o app
 * ficou aberto a noite toda.
 *
 * Guardando a data, a pergunta vira uma comparação: "o dia que fechei é o dia
 * de hoje?". Não há nada para expirar — a virada do dia já responde sozinha,
 * com o app aberto ou fechado, e ainda funciona se o celular ficar dias
 * desligado.
 */
const CHAVE = 'versiculo_dispensado_em';

type Estado = {
  versiculo: Versiculo;
  /**
   * `null` enquanto o disco não respondeu.
   *
   * A Home usa isso para não desenhar nada ainda. Assumir "visível" faria o
   * card aparecer e sumir num piscar toda vez que ele já estivesse
   * dispensado — e piscada de conteúdo parece defeito, não animação.
   */
  visivel: boolean | null;
  dispensar: () => void;
};

export function useVersiculoDoDia(): Estado {
  const hoje = chaveDeHoje();
  const [visivel, setVisivel] = useState<boolean | null>(null);

  useEffect(() => {
    let vivo = true;

    AsyncStorage.getItem(CHAVE)
      .then((dispensadoEm) => {
        if (vivo) setVisivel(dispensadoEm !== hoje);
      })
      .catch(() => {
        // Disco indisponível: mostrar é o erro menos ruim. Esconder por causa
        // de uma falha de leitura tiraria da tela algo que ninguém pediu para
        // tirar.
        if (vivo) setVisivel(true);
      });

    // O componente pode sair antes da resposta do disco — trocar estado
    // depois disso vaza memória e avisa no console.
    return () => {
      vivo = false;
    };
  }, [hoje]);

  const dispensar = useCallback(() => {
    // Some na hora; o disco vai atrás. Esperar a gravação para animar deixaria
    // o toque parecendo travado.
    setVisivel(false);
    AsyncStorage.setItem(CHAVE, hoje).catch(() => {
      // Sem gravar, o versículo volta na próxima abertura. É o pior caso, e
      // ele é pequeno.
    });
  }, [hoje]);

  return { versiculo: versiculoDoDia(), visivel, dispensar };
}
