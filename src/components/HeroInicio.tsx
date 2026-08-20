import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image, Text, View, type ImageSourcePropType } from 'react-native';
import { NOME_IGREJA } from '../constants/igreja';
import { tracking } from '../constants/theme';
import { useThemeColors } from '../hooks/useThemeColors';
import { urlImagem } from '../services/imagem';

/**
 * Hero da Home.
 *
 * Duas formas, escolhidas pela presença de `imagem`:
 *
 * 1. COM FOTO — a foto ocupa a faixa inteira e recebe um véu escuro por cima
 *    (`overlay`). O véu não é enfeite: sem ele o texto branco cai em cima de
 *    céu claro e some. É o padrão de "hero fotográfico com scrim", o único
 *    jeito de garantir contraste sobre uma foto que você não controla.
 *
 * 2. SEM FOTO — emblema, título e frase sobre o marrom da marca. É o estado
 *    atual, mantido como fallback para o app nunca depender de um arquivo.
 *
 * ── De onde vem a foto ───────────────────────────────────────────────
 * Da liderança, por upload, guardada em `ConfiguracaoIgreja.heroImagemUrl`.
 *
 * Antes era um `require('assets/hero-igreja.jpg')`: trocar a capa exigia
 * commitar um arquivo e publicar versão nova do app. Nenhum pastor faz
 * deploy, então na prática a capa era imutável.
 *
 * A prop aceita as duas formas — `ImageSourcePropType` para um asset local e
 * `string` para URL remota. O asset continua servindo para uma imagem de
 * marca que nunca muda; a URL é o caminho normal.
 *
 * ── Sobre a saudação ──────────────────────────────────────────────────
 * O nome da pessoa entra porque hero genérico é decoração; hero que sabe com
 * quem está falando é conteúdo. Só o primeiro nome — "Bem-vindo, João Marcos
 * Ferreira da Silva" quebra em três linhas no celular.
 */

type HeroInicioProps = {
  nomeCompleto?: string | null;
  versiculo: string;
  /**
   * Capa do topo: URL do Cloudinary ou asset local. Sem ela, o hero cai no
   * layout de emblema — que não é degradação, é o estado normal de uma
   * igreja que ainda não subiu foto.
   */
  imagem?: ImageSourcePropType | string | null;
  /** Logo da igreja. Sem ela, usa o glifo de igreja como emblema. */
  logo?: ImageSourcePropType;
};

function saudacaoDaHora(hora: number): string {
  if (hora < 12) return 'Bom dia';
  if (hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

function primeiroNome(nomeCompleto?: string | null): string | null {
  const nome = nomeCompleto?.trim().split(/\s+/)[0];
  return nome ? nome : null;
}

export function HeroInicio({ nomeCompleto, versiculo, imagem, logo }: HeroInicioProps) {
  const colors = useThemeColors();
  const nome = primeiroNome(nomeCompleto);
  const saudacao = saudacaoDaHora(new Date().getHours());

  /**
   * URL vira `{ uri }`; asset local passa direto.
   *
   * Pelo `urlImagem` quando é remota: o hero ocupa a largura da tela, e a
   * capa original tem 1200px. Sem a transformação, a Home — a tela mais
   * aberta do app — baixaria a imagem cheia a cada visita.
   */
  const fonte: ImageSourcePropType | null =
    typeof imagem === 'string'
      ? { uri: urlImagem(imagem, { largura: 393, altura: 230 })! }
      : (imagem ?? null);

  const conteudo = (
    <>
      {!fonte ? (
        // Emblema só no fallback: sobre foto ele viraria um borrão no meio da
        // imagem, e a foto já é o elemento visual.
        <View className="mb-xs h-16 w-16 items-center justify-center rounded-full border border-gold/40 bg-gold/10">
          {logo ? (
            <Image
              source={logo}
              accessible={false}
              className="h-11 w-11"
              resizeMode="contain"
            />
          ) : (
            <MaterialCommunityIcons name="church" size={34} color={colors.gold} />
          )}
        </View>
      ) : null}

      {/* ═══ SOBRE FOTO, O APOIO USA A TINTA DO TÍTULO ═══
          A saudação e o versículo eram `gold-soft`. Sobre o marrom liso isso
          funciona; sobre FOTO, não: com o véu aplicado a uma imagem clara, o
          dourado suave mede 2,11:1 no tema claro — texto de 14px precisa de
          4,5:1.

          O dourado desta paleta é cor de fundo tingido, não tinta sobre
          claro. É a terceira vez que isso aparece; aqui a diferença é que a
          foto vem da liderança, então não dá para "escolher uma imagem que
          combine" — tem que funcionar com qualquer uma.

          A 82% da tinta invertida ele continua sendo um degrau abaixo do
          título, que é o papel dele, e passa em 4,97:1. */}
      <Text
        className="font-sans-medium text-sm"
        style={
          fonte
            ? { color: colors.inverseInk, opacity: 0.82 }
            : { color: colors.goldSoft }
        }
      >
        {nome ? `${saudacao}, ${nome}` : saudacao}
      </Text>

      <Text
        accessibilityRole="header"
        className="text-center font-serif-bold text-[30px] leading-9 text-inverse-ink"
        style={{ letterSpacing: tracking.display }}
      >
        Bem-vindo à {NOME_IGREJA}
      </Text>

      {/* Itálico e um degrau menor: é frase de apoio, não um segundo título
          competindo com o primeiro. A cor segue a mesma regra da saudação. */}
      <Text
        className="text-center font-serif text-sm italic leading-5"
        style={
          fonte
            ? { color: colors.inverseInk, opacity: 0.82 }
            : { color: colors.goldSoft }
        }
      >
        {versiculo}
      </Text>
    </>
  );

  if (!fonte) {
    return (
      <View className="items-center gap-sm bg-inverse-surface px-gutter pb-8 pt-lg">
        {conteudo}
      </View>
    );
  }

  return (
    <View className="bg-inverse-surface" style={{ minHeight: 230 }}>
      <Image
        source={fonte}
        // `absoluteFill` em vez de altura fixa: a faixa cresce com o texto
        // (nome comprido, fonte grande do sistema) e a foto acompanha.
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        resizeMode="cover"
        accessible={false}
      />
      {/* ═══ VÉU A 80%, NÃO 62% ═══
          O valor antigo foi medido só contra o TÍTULO. Medindo o pior caso
          real — uma foto totalmente branca, que é o que acontece com céu
          estourado ou parede clara — 62% entregava:

            título 3,62:1   ·   texto de apoio 2,99:1

          O título passa raspando (é 30px em negrito, piso de 3:1), o apoio
          reprova. A 80%: 6,46:1 e 4,97:1 — os dois com folga.

          O custo é a foto ficar mais escura. Mas a alternativa é escolher
          entre legibilidade e imagem, e num hero a legibilidade ganha: quem
          quiser a foto mais viva escolhe uma imagem já escura. */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: colors.inverseSurface,
          opacity: 0.8,
        }}
      />
      <View className="items-center gap-sm px-gutter pb-8 pt-3xl">{conteudo}</View>
    </View>
  );
}
