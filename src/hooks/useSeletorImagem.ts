import { useCallback, useState } from 'react';
import { Alert, Linking } from 'react-native';
import {
  enviarImagem,
  escolherDaGaleria,
  tirarFoto,
  type PastaUpload,
  type ResultadoSelecao,
} from '../services/upload.service';
import { extractErrorMessage } from '../services/api';

type Opcoes = {
  pasta: PastaUpload;
  /** Recorte 1:1 (foto de perfil) em vez de 16:9 (capa). */
  quadrado?: boolean;
  /** Chamado com a URL hospedada quando o upload termina. */
  onEnviada: (url: string) => void;
  /** Se informado, aparece a opção "Remover foto" no menu. */
  onRemovida?: () => void;
};

/**
 * Centraliza o fluxo "escolher origem → comprimir → subir → devolver a URL".
 *
 * Vive num hook porque quatro telas diferentes precisam exatamente disso
 * (perfil, capa de evento, capa de devocional e foto de grupo familiar), e
 * duplicar o tratamento de permissão negada em cada uma é como esses fluxos
 * costumam divergir com o tempo.
 */
export function useSeletorImagem({
  pasta,
  quadrado = false,
  onEnviada,
  onRemovida,
}: Opcoes) {
  const [isEnviando, setIsEnviando] = useState(false);

  const processar = useCallback(
    async (resultado: ResultadoSelecao) => {
      // Cancelar é normal: a pessoa desistiu, não há nada a avisar.
      if (resultado.status === 'cancelado') return;

      if (resultado.status === 'sem-permissao') {
        // O sistema só mostra o diálogo de permissão na primeira vez. Depois
        // disso ele apenas devolve "negado", em silêncio — e o botão passaria a
        // não fazer absolutamente nada. Daí o caminho explícito para os ajustes.
        const alvo =
          resultado.origem === 'camera' ? 'à câmera' : 'às suas fotos';
        Alert.alert(
          'Permissão necessária',
          `O app precisa de acesso ${alvo} para essa opção. Você pode liberar nos ajustes do aparelho.`,
          [
            { text: 'Agora não', style: 'cancel' },
            { text: 'Abrir ajustes', onPress: () => void Linking.openSettings() },
          ],
        );
        return;
      }

      setIsEnviando(true);
      try {
        const { url } = await enviarImagem(resultado.uri, pasta);
        onEnviada(url);
      } catch (e) {
        Alert.alert(
          'Não foi possível enviar',
          extractErrorMessage(e, 'Tente novamente com outra imagem.'),
        );
      } finally {
        setIsEnviando(false);
      }
    },
    [pasta, onEnviada],
  );

  const abrir = useCallback(() => {
    const opcoes: Parameters<typeof Alert.alert>[2] = [
      {
        text: 'Tirar foto',
        onPress: () => void tirarFoto(quadrado).then(processar),
      },
      {
        text: 'Escolher da galeria',
        onPress: () => void escolherDaGaleria(quadrado).then(processar),
      },
    ];

    if (onRemovida) {
      opcoes.push({
        text: 'Remover foto',
        style: 'destructive',
        onPress: onRemovida,
      });
    }

    opcoes.push({ text: 'Cancelar', style: 'cancel' });

    Alert.alert('Foto', 'Como você quer adicionar a imagem?', opcoes);
  }, [quadrado, processar, onRemovida]);

  return { abrir, isEnviando };
}
