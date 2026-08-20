import { Image, Text, View } from 'react-native';
import { getIniciais } from '../services/prayer.service';
import { urlImagem } from '../services/imagem';

/**
 * Avatar da pessoa: mostra a foto quando existe, e as iniciais do nome
 * quando não existe.
 *
 * O "?" só aparece se o nome também estiver vazio — o que, antes, acontecia
 * com todo mundo por causa de um campo lido com o nome errado.
 */
type AvatarProps = {
  nome: string | null | undefined;
  fotoUrl?: string | null;
  size?: number;
};

export function Avatar({ nome, fotoUrl, size = 40 }: AvatarProps) {
  if (fotoUrl) {
    return (
      <Image
        source={{ uri: urlImagem(fotoUrl, { largura: size, altura: size }) }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        accessibilityLabel={nome ? `Foto de ${nome}` : 'Foto do usuário'}
      />
    );
  }

  return (
    <View
      className="items-center justify-center rounded-full bg-surface-container-high"
      style={{ width: size, height: size }}
    >
      <Text
        className="font-sans-semibold text-ink"
        style={{ fontSize: Math.max(11, size * 0.38) }}
      >
        {getIniciais(nome)}
      </Text>
    </View>
  );
}
