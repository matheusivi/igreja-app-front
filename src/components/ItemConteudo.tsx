import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Alert, Image, Pressable, Text, View, type AlertButton } from 'react-native';
import { elevation, radius, spacing, tracking } from '../constants/theme';
import { useThemeColors } from '../hooks/useThemeColors';
import { makeExcerpt, type Conteudo } from '../services/content.service';
import { urlImagem } from '../services/imagem';

/**
 * A gramática dos índices de conteúdo — Avisos e Devocionais.
 *
 * ═══ POR QUE UM ARQUIVO SÓ ═══
 * As duas telas eram 80% o mesmo código copiado: mesmo card, mesmo par de
 * ícones de gerenciar, mesmo resumo, mesma linha de autor. Copiado, não
 * compartilhado — qualquer correção tinha que ser feita duas vezes, e as duas
 * já tinham derivado (uma com proporção 21/9, a outra 16/9; uma com estado
 * vazio em card, a outra em texto solto).
 *
 * ═══ TRÊS VALORES, NÃO UM ═══
 * A primeira versão desta tela era clara sobre clara: papel #F7F3EE com card
 * #FFFFFF em cima — 3% de diferença. Tudo no mesmo tom, sem âncora nenhuma
 * para o olho; a página não tinha começo nem chão, só flutuava.
 *
 * A correção não é enfeitar, é dar ESCALA TONAL:
 *
 *   1. escuro   → `ItemDestaque` sobre `inverse-surface`. UM por tela.
 *   2. claro    → as linhas do índice, sobre o papel.
 *   3. tingido  → `TileCriar` em `secondary-soft`, fechando a lista.
 *
 * Um elemento escuro que aparece uma vez é atmosfera; escuro em toda tela
 * seria peso — foi por isso que a faixa marrom saiu do `ScreenHeader`. Aqui
 * ele volta em UM lugar, e passa a ser o ponto para onde o olho vai primeiro.
 *
 * ═══ LÍDER + ÍNDICE, NÃO PILHA DE CARDS ═══
 * `ItemDestaque` é a matéria de capa: capa sangrada, resumo, respiro — o
 * TAMANHO diz o que um selo escrito "Destaque" dizia antes. `ItemLista` é o
 * resto: miniatura quadrada, título, divisória, sem superfície própria.
 * Cabem seis por tela em vez de um.
 *
 * ═══ NENHUM `Pressable` CARREGA APARÊNCIA ═══
 * O NativeWind resolve `className` para o prop `style`. Quando o `style`
 * também é passado — e ainda por cima como FUNÇÃO, que é o jeito de reagir ao
 * toque — as duas fontes disputam o mesmo prop, e o que perde o merge
 * simplesmente não existe. Foi assim que o bloco de vídeo sumiu da tela de
 * leitura, e foi assim que o círculo do botão "+" saiu daqui sem fundo,
 * deixando um "+" branco quase invisível sobre o papel.
 *
 * A regra que ficou: o `Pressable` só reage (opacidade), e uma `View` filha
 * carrega TODA a aparência. Se o merge falhar, o pior caso é perder o efeito
 * de toque — nunca o botão inteiro.
 */

/** Permissão já resolvida pela tela: sem função, sem botão. */
export type AcoesConteudo = {
  onEditar?: () => void;
  onExcluir?: () => void;
};

type ItemProps = AcoesConteudo & {
  conteudo: Conteudo;
  /** Pedaços da linha de estado, unidos por "·". Cada tela monta a sua. */
  meta: string[];
  /** Estado de exceção — hoje só "Vencido". Ganha a cor de erro. */
  alerta?: string | null;
  lido?: boolean;
  /** Ícone da miniatura quando o conteúdo não tem imagem. */
  icone: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress: () => void;
};

/* ══════════════════════════════════════════════════════════════════════
   DESTAQUE — o elemento escuro da tela
   ══════════════════════════════════════════════════════════════════════ */

export function ItemDestaque({
  conteudo,
  meta,
  alerta,
  lido,
  icone,
  onPress,
  onEditar,
  onExcluir,
}: ItemProps) {
  const colors = useThemeColors();
  const temCapa = Boolean(conteudo.imagemUrl);

  /**
   * ═══ POR QUE A MARCA VOLTOU ═══
   * Eu a tinha tirado com o argumento de que a POSIÇÃO já diz "este é o
   * destaque". O argumento vale enquanto o destaque é também o mais recente.
   * Quando não é — e a ordenação do servidor põe `principal` antes da data —
   * um devocional de julho aparece acima dos de agosto e nada explica por
   * quê. Deixa de parecer curadoria e passa a parecer lista quebrada.
   *
   * Chip sólido em `gold-fixed`, e não texto sobre a foto: assim ele não
   * depende da imagem que a liderança subiu para ser legível, e usa o mesmo
   * dourado com que a Home já marca o destaque — uma flag, uma linguagem.
   */
  const emDestaque = conteudo.principal;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={conteudo.titulo}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
    >
      <View
        style={[
          {
            alignSelf: 'stretch',
            borderRadius: radius.lg,
            overflow: 'hidden',
            backgroundColor: colors.inverseSurface,
          },
          elevation.raised,
        ]}
      >
        {temCapa ? (
          /* 3:2, não 16:9. 16:9 é a proporção do VÍDEO; em foto ela corta
             cabeça e pé de qualquer retrato. 3:2 é a proporção da fotografia
             — a mesma escolha do card de aniversário, pelo mesmo motivo. */
          <View style={{ alignSelf: 'stretch', aspectRatio: 3 / 2 }}>
            <Image
              source={{ uri: urlImagem(conteudo.imagemUrl!, { largura: 353, altura: 235 }) }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
              accessible={false}
            />
            {lido ? (
              <View style={{ position: 'absolute', left: spacing.md, top: spacing.md }}>
                <SeloCapa rotulo="Lido" />
              </View>
            ) : null}

            {/* Cantos opostos: "Lido" é sobre MIM, "Em destaque" é sobre o
                conteúdo. Empilhados no mesmo canto pareceriam a mesma
                categoria de informação. */}
            {emDestaque ? (
              <View style={{ position: 'absolute', right: spacing.md, top: spacing.md }}>
                <SeloDestaque />
              </View>
            ) : null}
          </View>
        ) : (
          /* Sem capa, uma faixa mais clara dentro do próprio escuro. Sem ela
             o destaque perde o volume que o separa do índice e vira só um
             card com a fonte maior. */
          <View
            style={{
              alignSelf: 'stretch',
              height: 96,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255,255,255,0.06)',
            }}
          >
            <MaterialCommunityIcons name={icone} size={30} color={colors.inverseInk} />
          </View>
        )}

        <View style={{ padding: spacing.xl, gap: spacing.sm }}>
          {/* Sem capa não há onde pousar o selo — ele entra acima do título,
              que é o topo do conteúdo. */}
          {emDestaque && !temCapa ? (
            <View className="flex-row">
              <SeloDestaque />
            </View>
          ) : null}

          <Text
            className="font-serif-bold text-[21px] leading-7"
            style={{ color: colors.inverseInk, letterSpacing: tracking.heading }}
            numberOfLines={3}
          >
            {conteudo.titulo}
          </Text>

          {conteudo.texto ? (
            <Text
              className="font-sans text-[14px] leading-6"
              // 78% do texto invertido sobre o próprio fundo: 8,01:1 no claro
              // e 7,60:1 no escuro. Cinza "elegante" aqui viraria 3:1.
              style={{ color: colors.inverseInk, opacity: 0.78 }}
              numberOfLines={3}
            >
              {makeExcerpt(conteudo.texto, 180)}
            </Text>
          ) : null}

          <LinhaEstado
            meta={meta}
            alerta={alerta}
            // Com capa o "Lido" já está sobre a foto — repetir aqui seria
            // dizer a mesma coisa duas vezes no mesmo card.
            lido={temCapa ? false : lido}
            titulo={conteudo.titulo}
            inverso
            onEditar={onEditar}
            onExcluir={onExcluir}
          />
        </View>
      </View>
    </Pressable>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   LINHA DO ÍNDICE
   ══════════════════════════════════════════════════════════════════════ */

const MINIATURA = 84;

export function ItemLista({
  conteudo,
  meta,
  alerta,
  lido,
  icone,
  onPress,
  onEditar,
  onExcluir,
  ultimo = false,
}: ItemProps & { ultimo?: boolean }) {
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={conteudo.titulo}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: spacing.lg,
          paddingVertical: spacing.lg,
          borderBottomWidth: ultimo ? 0 : 1,
          borderBottomColor: colors.outlineVariant,
        }}
      >
        {conteudo.imagemUrl ? (
          <Image
            source={{
              uri: urlImagem(conteudo.imagemUrl, { largura: MINIATURA, altura: MINIATURA }),
            }}
            style={{ width: MINIATURA, height: MINIATURA, borderRadius: radius.sm }}
            resizeMode="cover"
            accessible={false}
          />
        ) : (
          /* Sem imagem não fica buraco: o ícone do tipo segura a coluna da
             esquerda e a linha continua alinhada com as vizinhas. Lista com
             calha irregular parece quebrada, não variada. */
          <View
            style={{
              width: MINIATURA,
              height: MINIATURA,
              borderRadius: radius.sm,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.surfaceDim,
            }}
          >
            <MaterialCommunityIcons name={icone} size={26} color={colors.inkMuted} />
          </View>
        )}

        <View style={{ flex: 1, gap: spacing.xs }}>
          <Text
            className="font-serif-bold text-[16px] leading-6 text-ink"
            style={{ letterSpacing: tracking.heading }}
            numberOfLines={2}
          >
            {conteudo.titulo}
          </Text>

          <LinhaEstado
            meta={meta}
            alerta={alerta}
            lido={lido}
            titulo={conteudo.titulo}
            onEditar={onEditar}
            onExcluir={onExcluir}
          />
        </View>
      </View>
    </Pressable>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   CRIAR
   ══════════════════════════════════════════════════════════════════════ */

/**
 * O convite para publicar — só na tela vazia.
 *
 * ═══ POR QUE SAIU DO FIM DA LISTA ═══
 * Ele já esteve no rodapé de toda lista, para devolver a descoberta que o "+"
 * sozinho no cabeçalho tinha perdido. Isso funcionava com um item na tela; com
 * trinta, o convite passa a viver depois de trinta rolagens — um botão que
 * ninguém alcança, sempre carregado e nunca visto. Afordância que depende do
 * tamanho da lista não é afordância, é acidente de um banco de dados vazio.
 *
 * A descoberta ficou onde não depende de quantidade: a pílula "Novo" no
 * cabeçalho, que tem rótulo e está sempre à mesma distância do polegar.
 *
 * Aqui ele continua sendo a resposta certa, porque na tela vazia não há lista
 * nenhuma para atravessar — ele É o conteúdo, e a única saída dali.
 *
 * Tingido em `secondary-soft`, não branco: é o terceiro valor da escala
 * tonal, o que impede a tela de ser clara sobre clara do topo ao rodapé.
 */
export function TileCriar({ rotulo, onPress }: { rotulo: string; onPress: () => void }) {
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <View
        style={{
          alignSelf: 'stretch',
          minHeight: 56,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.secondary,
          backgroundColor: colors.secondarySoft,
        }}
      >
        <MaterialCommunityIcons name="plus" size={19} color={colors.secondary} />
        {/* `secondary` e não `primary`: sobre `secondary-soft` o primary dá
            4,24:1 e fica logo abaixo do mínimo de texto. */}
        <Text className="font-sans-semibold text-[15px]" style={{ color: colors.secondary }}>
          {rotulo}
        </Text>
      </View>
    </Pressable>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   PEÇAS
   ══════════════════════════════════════════════════════════════════════ */

/**
 * Divisor de grupo: rótulo curto e um fio que ocupa o resto da linha.
 *
 * Não é o "sobretítulo" que saiu do cabeçalho. Aquele era decorativo e
 * aparecia em toda tela; este só existe quando há de fato dois grupos, e o
 * texto diz qual é ("Anteriores", "Vencidos"). O fio é o que dá a separação
 * horizontal que faltava numa página que era um bloco só.
 */
export function TituloGrupo({ children }: { children: string }) {
  return (
    <View className="flex-row items-center gap-md pb-sm pt-xl">
      <Text
        className="font-serif text-[13px] text-ink-muted"
        style={{ letterSpacing: tracking.heading }}
      >
        {children}
      </Text>
      <View className="h-px flex-1 bg-outline-variant" />
    </View>
  );
}

/**
 * Autor · data · minutos, e à direita o "···".
 *
 * O rótulo do tipo saiu daqui. "AVISO" em cima de todo card, dentro da tela
 * chamada "Avisos da igreja", é uma linha inteira que não informa nada — e
 * ainda vinha em verde, cor que a paleta reserva para confirmação.
 */
function LinhaEstado({
  meta,
  alerta,
  lido,
  titulo,
  inverso = false,
  onEditar,
  onExcluir,
}: {
  meta: string[];
  alerta?: string | null;
  lido?: boolean;
  titulo: string;
  inverso?: boolean;
} & AcoesConteudo) {
  const colors = useThemeColors();
  const texto = meta.filter(Boolean).join(' · ');

  // Sobre o cartão invertido o verde de confirmação some (2,38:1 no claro,
  // 1,67:1 no escuro). Ali quem marca é a própria tinta do cartão.
  const corSecundaria = inverso ? colors.inverseInk : colors.inkMuted;

  return (
    <View className="flex-row items-center gap-sm">
      {/* Lido é marca discreta, não selo verde. O selo anterior era
          `bg-success-soft` com `text-on-success`: verde claro com texto
          BRANCO, 1,30:1 — era ele que aparecia lavado na tela. Estado de "já
          vi isto" tem que recuar, não brilhar. */}
      {lido ? (
        <MaterialCommunityIcons
          name="check-circle"
          size={14}
          color={inverso ? colors.inverseInk : colors.success}
          style={inverso ? { opacity: 0.78 } : undefined}
        />
      ) : null}

      {texto ? (
        <Text
          className="flex-shrink font-sans text-[13px]"
          style={{ color: corSecundaria, opacity: inverso ? 0.78 : 1 }}
          numberOfLines={1}
        >
          {texto}
        </Text>
      ) : null}

      {alerta ? (
        <View className="rounded-md bg-surface-dim px-2 py-0.5">
          <Text className="font-sans-semibold text-[11px] text-error">{alerta}</Text>
        </View>
      ) : null}

      <View className="ml-auto">
        <BotaoGerenciar
          titulo={titulo}
          inverso={inverso}
          onEditar={onEditar}
          onExcluir={onExcluir}
        />
      </View>
    </View>
  );
}

function BotaoGerenciar({
  titulo,
  inverso = false,
  onEditar,
  onExcluir,
}: { titulo: string; inverso?: boolean } & AcoesConteudo) {
  const colors = useThemeColors();
  if (!onEditar && !onExcluir) return null;

  function abrir() {
    const opcoes: AlertButton[] = [];
    if (onEditar) opcoes.push({ text: 'Editar', onPress: onEditar });
    if (onExcluir)
      opcoes.push({ text: 'Excluir', style: 'destructive', onPress: onExcluir });
    opcoes.push({ text: 'Cancelar', style: 'cancel' });
    Alert.alert(titulo, undefined, opcoes);
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Opções de ${titulo}`}
      onPress={abrir}
      /* 20 de glifo + 12 de folga em volta = 44 de alvo, o mínimo da regra.
         O par lápis/lixeira anterior dava 30, e eram dois. */
      hitSlop={12}
      style={({ pressed }) => ({ opacity: pressed ? 0.5 : inverso ? 0.78 : 1 })}
    >
      <MaterialCommunityIcons
        name="dots-horizontal"
        size={20}
        color={inverso ? colors.inverseInk : colors.inkMuted}
      />
    </Pressable>
  );
}

/**
 * "Em destaque" — o mesmo dourado com que a Home marca o destaque.
 *
 * Chip SÓLIDO, não texto sobre a foto: `gold-fixed` tem par de texto próprio
 * (`on-gold-fixed`) nos dois temas, então a legibilidade não depende da
 * imagem que subiram. Dourado sobre foto clara seria uma loteria — foi
 * exatamente o erro que já apareceu na linha do aniversariante, com 2,34:1.
 */
function SeloDestaque() {
  const colors = useThemeColors();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radius.full,
        backgroundColor: colors.goldFixed,
      }}
    >
      <MaterialCommunityIcons name="star" size={12} color={colors.onGoldFixed} />
      <Text
        className="font-sans-semibold text-[11px]"
        style={{ color: colors.onGoldFixed }}
      >
        Em destaque
      </Text>
    </View>
  );
}

/** Marca sobre a capa — véu escuro fixo, texto branco. */
function SeloCapa({ rotulo }: { rotulo: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radius.full,
        // Preto a 55% dá 4,74:1 com texto branco mesmo sobre uma foto BRANCA,
        // o pior caso. Não depende de sorte com a imagem que subiram.
        backgroundColor: 'rgba(0,0,0,0.55)',
      }}
    >
      <MaterialCommunityIcons name="check" size={12} color="#FFFFFF" />
      <Text className="font-sans-semibold text-[11px]" style={{ color: '#FFFFFF' }}>
        {rotulo}
      </Text>
    </View>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   VAZIO
   ══════════════════════════════════════════════════════════════════════ */

/**
 * O estado vazio é onde o texto explicativo finalmente serve.
 *
 * A frase "Comunicados e informações importantes para a família IBVI" vivia
 * fixa no topo, ocupando duas linhas em toda visita, dizendo o que a pessoa
 * já sabia ao tocar em "Avisos". Aqui ela tem função: é a única tela em que
 * não há conteúdo nenhum para explicar o que este lugar é.
 */
export function ListaVazia({
  icone,
  titulo,
  descricao,
  acao,
}: {
  icone: keyof typeof MaterialCommunityIcons.glyphMap;
  titulo: string;
  descricao: string;
  acao?: React.ReactNode;
}) {
  const colors = useThemeColors();

  return (
    <View className="items-center gap-md px-xl py-3xl">
      <MaterialCommunityIcons name={icone} size={32} color={colors.inkMuted} />
      <Text
        className="text-center font-serif-bold text-[17px] text-ink"
        style={{ letterSpacing: tracking.heading }}
      >
        {titulo}
      </Text>
      <Text className="max-w-[280px] text-center font-sans text-[14px] leading-6 text-ink-muted">
        {descricao}
      </Text>
      {acao ? <View className="mt-sm w-full">{acao}</View> : null}
    </View>
  );
}
