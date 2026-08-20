import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { radius } from '../constants/theme';
import { useThemeColors } from '../hooks/useThemeColors';
import { urlImagem } from '../services/imagem';
import { urlDoVideo, youtubeId, type BlocoConteudo } from '../services/content.service';

/**
 * Renderiza o post na ordem em que foi escrito.
 *
 * ═══ SERIFADA NO CORPO, E SÓ AQUI ═══
 * Todo o resto do app usa Plus Jakarta no corpo. Esta tela é a exceção, e a
 * razão é o tipo de leitura: devocional é texto CORRIDO, lido do começo ao
 * fim, e não informação que se varre com o olho. Serifada com serifa de
 * texto — que é o caso da Source Serif — sustenta parágrafo longo melhor,
 * porque as serifas dão uma linha de base horizontal que guia o olho.
 *
 * É também o que diferencia "isto é para ler" de "isto é para consultar", sem
 * precisar de nenhum rótulo. Substack, Medium e os apps de Bíblia fazem o
 * mesmo, e não por moda.
 *
 * ═══ ESCALA EM VEZ DE TAMANHO FIXO ═══
 * O corpo base é 17, mas quem manda é o multiplicador vindo da preferência da
 * pessoa. A entrelinha acompanha proporcionalmente: aumentar a fonte sem
 * aumentar o espaço entre linhas piora a leitura em vez de melhorar, porque
 * as linhas se colam.
 */

const CORPO_BASE = 17;
const ENTRELINHA = 1.7;

type Props = {
  blocos: BlocoConteudo[];
  /** Multiplicador do corpo. 1 = padrão. */
  escala?: number;
  /** `false` no aviso: comunicado se varre, não se lê por parágrafos. */
  serifado?: boolean;
};

export function LeitorBlocos({ blocos, escala = 1, serifado = true }: Props) {
  return (
    <View className="gap-xl">
      {blocos.map((bloco, index) => (
        <Bloco
          key={`${bloco.tipo}-${index}`}
          bloco={bloco}
          escala={escala}
          serifado={serifado}
        />
      ))}
    </View>
  );
}

function Bloco({
  bloco,
  escala,
  serifado,
}: {
  bloco: BlocoConteudo;
  escala: number;
  serifado: boolean;
}) {
  if (bloco.tipo === 'imagem') {
    return (
      <Image
        source={{ uri: urlImagem(bloco.valor, { largura: 353, altura: 199 }) }}
        className="w-full rounded-lg"
        style={{ aspectRatio: 16 / 9 }}
        resizeMode="cover"
        accessible={false}
      />
    );
  }

  if (bloco.tipo === 'video') return <BlocoVideo url={bloco.valor} />;

  const corpo = Math.round(CORPO_BASE * escala);

  return (
    <View style={{ gap: Math.round(corpo * 0.9) }}>
      {bloco.valor
        .split(/\n\n+/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((paragrafo, i) => (
          <Text
            key={i}
            className="text-ink"
            style={{
              fontFamily: serifado
                ? 'SourceSerif4_600SemiBold'
                : 'PlusJakartaSans_400Regular',
              fontSize: corpo,
              // A entrelinha acompanha a escala: fonte grande com entrelinha
              // fixa fica com as linhas coladas, e o ganho vira prejuízo.
              lineHeight: Math.round(corpo * ENTRELINHA),
            }}
          >
            {paragrafo}
          </Text>
        ))}
    </View>
  );
}

/**
 * Vídeo do post: capa do YouTube com botão de play, que abre o vídeo fora
 * do app.
 *
 * Tentamos o player embutido antes e ele não se sustenta. O YouTube passou a
 * verificar a identidade de quem incorpora (julho de 2025) e responde erro
 * 153 ou 152 dentro de um WebView. Mesmo contornando, cada vídeo depende de o
 * dono ter permitido incorporação — algo que a igreja não controla ao linkar
 * pregação de outro canal.
 *
 * ═══ TUDO É UM ALVO SÓ ═══
 * Antes a capa era um `Pressable` e a linha "Assistir no YouTube" embaixo era
 * texto morto. Quem lê vê capa + legenda como UMA coisa e toca onde o dedo
 * cair — e metade das vezes cai na legenda, onde não acontecia nada. A
 * legenda agora está DENTRO do mesmo `Pressable`.
 *
 * ═══ O TAMANHO VIVE NO `style`, NÃO NO `className` ═══
 * O NativeWind resolve `className` para o prop `style`. Quando `style`
 * também é passado — e ainda por cima como FUNÇÃO, que é o jeito de reagir
 * ao toque — as duas fontes disputam a mesma propriedade e a ordem de merge
 * decide quem vence. Se o `w-full` do `className` perde, o quadro fica com
 * largura 0; como todo o conteúdo dele é `position: absolute`, nada mede
 * nada e o bloco some sem deixar rastro. É o mesmo defeito que já tinha
 * deixado o botão com 26pt de altura.
 *
 * `alignSelf: 'stretch'` no `style` faz a mesma coisa que `w-full` e não
 * depende de merge nenhum.
 */
function BlocoVideo({ url }: { url: string }) {
  const colors = useThemeColors();
  const id = youtubeId(url);
  const [capaFalhou, setCapaFalhou] = useState(false);

  async function abrir() {
    try {
      // URL canônica: o esquema `https://` é obrigatório, e sem ele a
      // promessa rejeitava em silêncio. Ver `urlDoVideo`.
      await Linking.openURL(urlDoVideo(url));
    } catch {
      Alert.alert(
        'Não foi possível abrir o vídeo',
        'Verifique o link do YouTube e a conexão com a internet.',
      );
    }
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Assistir ao vídeo no YouTube"
      accessibilityHint="Abre o aplicativo do YouTube, ou o navegador"
      onPress={abrir}
      style={({ pressed }) => pressed && { opacity: 0.85 }}
    >
      <View
        style={{
          alignSelf: 'stretch',
          aspectRatio: 16 / 9,
          borderRadius: radius.lg,
          overflow: 'hidden',
          // Fundo escuro por baixo da capa: enquanto ela baixa, o quadro já
          // existe e o texto não pula quando a imagem entra.
          backgroundColor: '#12100E',
        }}
      >
        {/* `hqdefault` existe para todo vídeo público. As resoluções maiores
            (`maxresdefault`) faltam em muitos vídeos antigos e devolvem 404,
            que no React Native vira um quadro preto sem aviso.

            Se mesmo assim a capa falhar — link fora do padrão, vídeo privado,
            rede bloqueando `img.youtube.com` — o quadro NÃO fica vazio: o
            `onError` acende o cartão de reserva abaixo, que continua clicável.
            Um bloco de vídeo nunca pode renderizar como nada. */}
        {id && !capaFalhou ? (
          <Image
            source={{ uri: `https://img.youtube.com/vi/${id}/hqdefault.jpg` }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            onError={() => setCapaFalhou(true)}
            accessible={false}
          />
        ) : null}

        <View style={StyleSheet.absoluteFill} className="items-center justify-center">
          <View
            className="items-center justify-center rounded-full"
            style={{ width: 64, height: 64, backgroundColor: 'rgba(0,0,0,0.55)' }}
          >
            <MaterialCommunityIcons name="play" size={32} color="#FFFFFF" />
          </View>
        </View>
      </View>

      <View className="mt-sm flex-row items-center justify-center gap-1">
        <MaterialCommunityIcons name="youtube" size={14} color={colors.inkMuted} />
        <Text className="font-sans text-[13px] text-ink-muted">
          {id && !capaFalhou ? 'Assistir no YouTube' : 'Abrir vídeo no YouTube'}
        </Text>
      </View>
    </Pressable>
  );
}
