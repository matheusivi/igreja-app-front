import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Avatar,
  Button,
  Chip,
  ListaVazia,
  ScreenHeader,
  ScriptureQuote,
  TextField,
  TituloGrupo,
} from '../../components';
import { elevation, radius, spacing, tracking } from '../../constants/theme';
import {
  oracaoKeys,
  useCriarPedido,
  useExcluirPedido,
  usePedidosOracao,
} from '../../hooks/queries/usePedidosOracao';
import { useAlternarReacao, useReacoesOracao } from '../../hooks/queries/useReacoesOracao';
import { useThemeColors } from '../../hooks/useThemeColors';
import { EspacoTabBar } from '../../navigation/TabBar';
import { useAuth } from '../../navigation/AuthContext';
import { extractErrorMessage } from '../../services/api';
import {
  MOTIVOS_DENUNCIA,
  moderacaoService,
  type MotivoDenuncia,
} from '../../services/moderacao.service';
import { formatRelativeTime, type PedidoOracao } from '../../services/prayer.service';
import { REACAO_VAZIA, type ReacaoPedido } from '../../services/reacaoOracao.service';
import { useAtualizarPuxando } from '../../hooks/useAtualizarPuxando';

/**
 * Altura das pílulas de reação — e a base do arredondamento delas.
 *
 * ═══ POR QUE NÃO `radius.full` ═══
 * `radius.full` é 9999, e o próprio `theme.ts` diz que ele serve para avatar
 * de PESSOA, e só. Num retângulo o Android precisa CLAMPAR esse valor para
 * metade da altura, e esse caminho de clamp se comporta de maneira diferente
 * conforme a versão e conforme o que mais mudou na view naquele render.
 *
 * Foi o que aconteceu com o "Amém": ele nascia redondo e virava QUADRADO
 * depois de alternar o estado, porque a alternância trocava o fundo E a
 * largura ao mesmo tempo. O "Vou orar" ao lado escapava só porque tem uma
 * borda de 1px, que obriga o Android a redesenhar o contorno inteiro.
 *
 * Metade da altura é o mesmo desenho, calculado por nós, sem depender de
 * clamp nenhum. 44 também é o alvo de toque mínimo — os dois números serem o
 * mesmo aqui é coincidência conveniente, não regra.
 */
const ALTURA_PILULA = 44;

/**
 * Mural de pedidos de oração.
 *
 * ═══ O QUE ESTAVA ERRADO NO REGISTRO ═══
 * O card era: avatar de 40px, nome em negrito, cargo, horário, texto, fio, e
 * dois botões de reação. Isso é a anatomia de um POST DE REDE SOCIAL, e ela
 * carrega a lógica de uma: quem falou vem antes do que foi dito, e a reação
 * fecha o bloco como se fosse engajamento.
 *
 * Um mural de oração não é um feed. Ninguém entra aqui para ver quem postou;
 * entra para saber por quem orar. Quando a identidade vem primeiro, a
 * primeira coisa que o olho faz é julgar de quem é o pedido — e não é isso
 * que a tela deveria provocar.
 *
 * A inversão: **o pedido primeiro, em serifada, e a pessoa embaixo, pequena,
 * como assinatura.** É o registro do BILHETE, não do post. Mesma informação,
 * ordem oposta, e a intenção da tela muda junto.
 *
 * A serifada aqui não é enfeite: no resto do app ela é reservada a título e
 * ao corpo do devocional. Ela marca "isto é texto de uma pessoa", não texto
 * de interface — o que separa o pedido dos rótulos que o cercam sem precisar
 * de moldura nenhuma.
 *
 * ═══ O VERSÍCULO DESCEU ═══
 * Ele abria a tela. Numa aba que se visita todo dia, o que abre a tela é
 * pedágio: bonito na primeira vez, mobília na centésima. No fim da lista ele
 * vira fecho — "estes são os pedidos... onde dois ou três estiverem
 * reunidos" — e ainda dá chão à página, que antes terminava no vazio.
 *
 * ═══ NENHUM `Pressable` CARREGA APARÊNCIA ═══
 * As duas pílulas de reação vinham com `className` de layout E `style` de
 * função ao mesmo tempo. É o padrão que já fez o bloco de vídeo sumir da tela
 * de leitura e o botão "+" perder o fundo: o NativeWind escreve o `className`
 * no mesmo prop `style`, e o que perde o merge não existe. Aqui era pior —
 * quem estava no `className` era justamente o ESTADO ATIVO (`bg-success`),
 * ou seja, o "Orando" podia simplesmente não aparecer.
 */

type Filtro = 'geral' | 'meus';

const FILTROS: { key: Filtro; label: string }[] = [
  { key: 'geral', label: 'Geral' },
  { key: 'meus', label: 'Meus pedidos' },
];

const MIN_CARACTERES = 10;
const SETE_DIAS = 7 * 24 * 60 * 60 * 1000;

export function PrayerWallScreen() {
  // Puxar para atualizar: dois celulares na mesma tela não se falavam.
  const { controle } = useAtualizarPuxando([oracaoKeys.all]);

  const colors = useThemeColors();
  const { user } = useAuth();

  const [filtro, setFiltro] = useState<Filtro>('geral');

  /**
   * ═══ O FILTRO AGORA VAI AO SERVIDOR ═══
   * "Meus pedidos" era feito aqui, sobre a lista carregada. Com a rolagem de
   * 15 em 15 isso quebraria: a primeira página traz os mais recentes de TODO
   * MUNDO, então quem tem pedidos antigos veria a própria aba vazia.
   *
   * Trocar de aba muda a chave do cache, então cada uma tem a própria pilha
   * de páginas — voltar para "Geral" não perde a rolagem que já foi feita.
   */
  const {
    pedidos,
    total,
    isPending,
    isFetching,
    error: queryError,
    carregandoMais,
    temMais,
    carregarMais,
    refetch,
  } = usePedidosOracao(filtro === 'meus');

  const criarPedido = useCriarPedido();
  const excluirPedido = useExcluirPedido();

  /**
   * Marcação pessoal, guardada no aparelho (mesmo caminho do "marcar como
   * lido" dos devocionais). Não é contador compartilhado: ninguém além de
   * quem marcou vê.
   */
  const reacoes = useReacoesOracao();
  const alternarReacao = useAlternarReacao();

  const [compondo, setCompondo] = useState(false);
  const [texto, setTexto] = useState('');
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);

  const error = queryError ? extractErrorMessage(queryError) : null;
  const restantes = MIN_CARACTERES - texto.trim().length;

  /** Pastor e Administrador moderam o mural; os demais só apagam o próprio. */
  const isModerador = ['Pastor', 'Administrador'].includes(user?.perfil ?? '');

  /**
   * Quantos pedidos são meus.
   *
   * Vem do `total` da consulta filtrada quando a aba "Meus" está aberta —
   * antes era contado sobre a lista carregada, então dizia "3" quando havia
   * 12. Na aba "Geral" a conta não é possível sem uma segunda consulta, e o
   * número ali serve só para rotular a aba.
   */
  const meusPedidos = filtro === 'meus' ? total : undefined;

  /**
   * Recentes e anteriores.
   *
   * Oração tem urgência: um pedido de ontem pede ação hoje; um de dois meses
   * é memória. Sem essa divisão, trinta pedidos viram uma parede em que tudo
   * pesa igual — e o que é urgente afunda junto com o que já passou.
   *
   * ═══ ESTA DIVISÃO CONTINUA NA TELA, E ESTÁ CERTA ═══
   * Diferente do filtro "Meus pedidos", aqui não há subconjunto escondido: a
   * lista vem do servidor ordenada do mais novo para o mais velho, então as
   * primeiras páginas são naturalmente as recentes e as seguintes, as
   * anteriores. A paginação faz o trabalho sozinha.
   */
  const { recentes, anteriores } = useMemo(() => {
    const corte = Date.now() - SETE_DIAS;

    return {
      recentes: pedidos.filter((p) => new Date(p.dataEnvio).getTime() >= corte),
      anteriores: pedidos.filter((p) => new Date(p.dataEnvio).getTime() < corte),
    };
  }, [pedidos]);

  const vazio = recentes.length === 0 && anteriores.length === 0;

  function abrirCompositor() {
    setCompondo(true);
    setErroEnvio(null);
  }

  function enviar() {
    const conteudo = texto.trim();
    if (conteudo.length < MIN_CARACTERES) {
      setErroEnvio(`Escreva pelo menos ${MIN_CARACTERES} caracteres.`);
      return;
    }
    setErroEnvio(null);
    criarPedido.mutate(conteudo, {
      onSuccess: () => {
        setTexto('');
        setCompondo(false);
      },
      onError: (e) =>
        setErroEnvio(extractErrorMessage(e, 'Não foi possível enviar o pedido.')),
    });
  }

  function confirmarExclusao(pedido: PedidoOracao) {
    const ehMeu = pedido.autor.id === user?.id;
    Alert.alert(
      'Excluir pedido',
      ehMeu
        ? 'Deseja remover o seu pedido de oração?'
        : `Excluir o pedido de ${pedido.autor.nomeCompleto || 'outro membro'}? Como ${user?.perfil}, você está moderando o mural.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () =>
            excluirPedido.mutate(pedido.id, {
              onError: (e) =>
                Alert.alert('Erro', extractErrorMessage(e, 'Não foi possível excluir.')),
            }),
        },
      ],
    );
  }

  /**
   * ╔═══════════════════════════════════════════════════════════════════╗
   * ║  DENUNCIAR E BLOQUEAR                                             ║
   * ╚═══════════════════════════════════════════════════════════════════╝
   *
   * As duas ações que as lojas exigem em app com conteúdo escrito por usuário
   * — e que, mais do que isso, dão saída imediata a quem se sentiu exposto
   * num mural que a igreja inteira lê.
   *
   * ═══ POR QUE OS DOIS, E NÃO SÓ UM ═══
   *   DENUNCIAR  pede que a liderança olhe — leva o tempo que levar
   *   BLOQUEAR   resolve agora, sozinha, sem depender de ninguém
   *
   * Quem foi ofendido não deveria precisar esperar o domingo.
   *
   * ═══ POR QUE `Alert` E NÃO UMA TELA ═══
   * É menu nativo do sistema, aparece na hora e fecha com um toque fora. Uma
   * tela para escolher entre duas opções seria cerimônia demais para uma ação
   * que precisa ser rápida — e a pressa aqui é do lado de quem está incomodado.
   */
  function abrirMaisOpcoes(pedido: PedidoOracao) {
    const nome = pedido.autor.nomeCompleto || 'esta pessoa';

    Alert.alert(nome, 'O que você quer fazer?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Denunciar este pedido',
        onPress: () => escolherMotivo(pedido),
      },
      {
        text: 'Bloquear esta pessoa',
        style: 'destructive',
        onPress: () => confirmarBloqueio(pedido),
      },
    ]);
  }

  /**
   * O motivo é lista fechada, não texto livre.
   *
   * Campo em branco trava justamente quem está incomodado, e produz cinquenta
   * redações diferentes para o mesmo problema — impossível de agrupar por quem
   * revisa. A lista é a mesma do servidor; divergir daria 400 sem explicação.
   */
  function escolherMotivo(pedido: PedidoOracao) {
    Alert.alert(
      'Qual o motivo?',
      'A liderança da igreja vai analisar.',
      [
        ...MOTIVOS_DENUNCIA.map((motivo) => ({
          text: motivo,
          onPress: () => enviarDenuncia(pedido, motivo),
        })),
        { text: 'Cancelar', style: 'cancel' as const },
      ],
    );
  }

  async function enviarDenuncia(pedido: PedidoOracao, motivo: MotivoDenuncia) {
    try {
      await moderacaoService.denunciarPedido(pedido.id, motivo);
      Alert.alert(
        'Denúncia enviada',
        'A liderança vai analisar. Se preferir não ver mais publicações desta pessoa, você também pode bloqueá-la.',
      );
    } catch (e) {
      Alert.alert('Erro', extractErrorMessage(e, 'Não foi possível denunciar.'));
    }
  }

  function confirmarBloqueio(pedido: PedidoOracao) {
    const nome = pedido.autor.nomeCompleto || 'esta pessoa';

    Alert.alert(
      `Bloquear ${nome}?`,
      // Dizer o que NÃO acontece importa tanto quanto o que acontece. Sem
      // isso, muita gente não bloqueia com medo de gerar confusão na igreja.
      'Você deixa de ver as publicações dela no mural. Ela não é avisada e não perde nada. Dá para desfazer no seu perfil.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Bloquear',
          style: 'destructive',
          onPress: async () => {
            try {
              await moderacaoService.bloquear(pedido.autor.id);
              // Recarrega o mural: os pedidos dessa pessoa somem da consulta,
              // no servidor. Filtrar aqui na tela deixaria a paginação errada.
              await refetch();
            } catch (e) {
              Alert.alert(
                'Erro',
                extractErrorMessage(e, 'Não foi possível bloquear.'),
              );
            }
          },
        },
      ],
    );
  }

  function renderPedido(pedido: PedidoOracao) {
    return (
      <CartaoPedido
        key={pedido.id}
        pedido={pedido}
        ehMeu={pedido.autor.id === user?.id}
        reacao={reacoes[pedido.id] ?? REACAO_VAZIA}
        podeExcluir={pedido.autor.id === user?.id || isModerador}
        onReagir={(tipo) => alternarReacao.mutate({ pedidoId: pedido.id, tipo })}
        onExcluir={() => confirmarExclusao(pedido)}
        onMaisOpcoes={() => abrirMaisOpcoes(pedido)}
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScreenHeader
        title="Pedidos de oração"
        busy={isFetching && !isPending}
        actionIcon="add"
        // Enquanto o compositor está aberto, criar de novo não faz sentido —
        // a ação sai em vez de virar um botão que não responde.
        actionLabel={compondo ? undefined : 'Novo pedido'}
        onActionPress={compondo ? undefined : abrirCompositor}
        acaoCompacta
      />

      <ScrollView
        className="flex-1 bg-background px-gutter"
        refreshControl={controle}
        contentContainerClassName="pb-xl"
        keyboardShouldPersistTaps="handled"
        /**
         * Rolagem infinita num `ScrollView`.
         *
         * A tela não é uma lista simples — tem cabeçalho, filtros, dois grupos
         * com títulos e o versículo no fim —, então trocar por `FlatList`
         * significaria reescrever tudo em `ListHeaderComponent`. Detectar a
         * chegada ao fim custa estas seis linhas.
         *
         * 400px de antecedência: pede a página seguinte ANTES de a pessoa
         * bater no fundo, para os itens já estarem lá quando ela chegar.
         */
        scrollEventThrottle={400}
        onScroll={({ nativeEvent: e }) => {
          const chegouAoFim =
            e.layoutMeasurement.height + e.contentOffset.y >=
            e.contentSize.height - 400;
          if (chegouAoFim) carregarMais();
        }}
      >
        <View className="flex-row gap-sm pb-lg pt-lg">
          {FILTROS.map((f) => (
            <Chip
              key={f.key}
              label={
                // A contagem só existe quando a aba "Meus" está aberta — é o
                // `total` daquela consulta. Na aba "Geral" o servidor não
                // informa quantos são meus, e inventar o número a partir da
                // página carregada foi justamente o que dizia "3" havendo 12.
                f.key === 'meus' && meusPedidos
                  ? `${f.label} (${meusPedidos})`
                  : f.label
              }
              active={filtro === f.key}
              onPress={() => setFiltro(f.key)}
            />
          ))}
        </View>

        {/* ═══ COMPOSITOR ═══
            Fundo tingido, e não branco: as notas da lista são brancas, então
            "escrever" e "ler" passam a ser superfícies diferentes. Sem isso o
            formulário era mais um card na pilha. */}
        {compondo ? (
          <View
            style={{
              gap: spacing.md,
              padding: spacing.lg,
              marginBottom: spacing.lg,
              borderRadius: radius.lg,
              backgroundColor: colors.surfaceDim,
            }}
          >
            <Text
              className="font-serif-bold text-[17px] text-ink"
              style={{ letterSpacing: tracking.heading }}
            >
              O que você quer que a igreja leve a Deus?
            </Text>

            <TextField
              label="Seu pedido"
              placeholder="Escreva com as suas palavras. A igreja ora com você."
              value={texto}
              onChangeText={(v) => {
                setTexto(v);
                setErroEnvio(null);
              }}
              multiline
              numberOfLines={4}
              autoFocus
            />

            {/* Contador, em vez de um botão travado sem explicação. */}
            <Text className="font-sans text-[13px] text-ink-muted">
              {restantes > 0
                ? `Faltam ${restantes} ${restantes === 1 ? 'caractere' : 'caracteres'}.`
                : 'Seu nome e foto aparecem junto do pedido.'}
            </Text>

            {erroEnvio ? (
              <Text className="font-sans text-[13px] text-error">{erroEnvio}</Text>
            ) : null}

            <View className="flex-row gap-sm">
              <View className="flex-1">
                <Button
                  label="Enviar"
                  loading={criarPedido.isPending}
                  disabled={restantes > 0}
                  icon={<Ionicons name="send" size={16} color={colors.onPrimary} />}
                  onPress={enviar}
                />
              </View>
              <View className="flex-1">
                <Button
                  label="Cancelar"
                  variant="secondary"
                  onPress={() => {
                    setCompondo(false);
                    setTexto('');
                    setErroEnvio(null);
                  }}
                />
              </View>
            </View>
          </View>
        ) : null}

        {isPending ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 48 }} />
        ) : error ? (
          <View className="items-center gap-md py-3xl">
            <Text className="text-center font-sans text-[14px] text-ink-muted">{error}</Text>
            <Pressable onPress={() => refetch()} hitSlop={12}>
              <Text className="font-sans-semibold text-[14px] text-secondary">
                Tentar novamente
              </Text>
            </Pressable>
          </View>
        ) : vazio ? (
          <ListaVazia
            icone="hand-heart-outline"
            titulo={
              filtro === 'meus'
                ? 'Você ainda não enviou um pedido'
                : 'O mural está silencioso'
            }
            descricao={
              filtro === 'meus'
                ? 'Compartilhe o que está no seu coração. A igreja ora com você.'
                : 'Quando alguém pedir oração, o pedido aparece aqui para a igreja interceder.'
            }
            acao={
              !compondo ? (
                <Button
                  label="Escrever pedido"
                  fullWidth={false}
                  icon={<Ionicons name="add" size={16} color={colors.onPrimary} />}
                  onPress={abrirCompositor}
                />
              ) : undefined
            }
          />
        ) : (
          <View className="gap-md">
            {/* O rótulo do grupo só aparece quando existem os DOIS grupos.
                Com uma lista só, ele estaria classificando nada. */}
            {recentes.length > 0 && anteriores.length > 0 ? (
              <TituloGrupo>Desta semana</TituloGrupo>
            ) : null}
            {recentes.map(renderPedido)}

            {anteriores.length > 0 ? (
              <>
                {recentes.length > 0 ? <TituloGrupo>Anteriores</TituloGrupo> : null}
                {anteriores.map(renderPedido)}
              </>
            ) : null}
          </View>
        )}

        {/* Fecho, não abertura. Ver o comentário do topo. */}
        {/* Só aparece enquanto a próxima página está a caminho. Sem ele a
            rolagem parece ter travado no fim da lista. */}
        {carregandoMais ? (
          <View className="items-center py-lg">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : null}

        {/* Diz que acabou. Sem isso, quem chega ao fim não sabe se a lista
            terminou ou se o app parou de carregar. */}
        {!temMais && pedidos.length > 0 && !isPending ? (
          <Text className="py-lg text-center font-sans text-[13px] text-ink-muted">
            {total === 1 ? '1 pedido no total' : `${total} pedidos no total`}
          </Text>
        ) : null}

        {!vazio && !error && !isPending ? (
          <View className="pt-2xl">
            <ScriptureQuote
              text="Pois onde dois ou três estiverem reunidos em meu nome, ali estou eu no meio deles."
              reference="Mateus 18:20"
            />
          </View>
        ) : null}

        {/* A barra de abas flutua sobre o conteúdo, fora do fluxo do layout.
            Sem este espaço, o último item fica escondido atrás dela. */}
        <EspacoTabBar />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   O BILHETE
   ══════════════════════════════════════════════════════════════════════ */

function CartaoPedido({
  pedido,
  ehMeu,
  reacao,
  podeExcluir,
  onReagir,
  onExcluir,
  onMaisOpcoes,
}: {
  pedido: PedidoOracao;
  ehMeu: boolean;
  reacao: ReacaoPedido;
  podeExcluir: boolean;
  onReagir: (tipo: 'praying' | 'amen') => void;
  onExcluir: () => void;
  onMaisOpcoes: () => void;
}) {
  const colors = useThemeColors();
  const ehLideranca = ['Líder', 'Pastor', 'Administrador'].includes(pedido.autor.perfil);

  return (
    <View
      style={[
        {
          alignSelf: 'stretch',
          gap: spacing.lg,
          padding: spacing.xl,
          borderRadius: radius.lg,
          backgroundColor: colors.surfaceBright,
        },
        elevation.subtle,
      ]}
    >
      {/* ── O pedido ─────────────────────────────────────────────────
          Serifada, 17px, entrelinha larga. É a única coisa aqui que uma
          pessoa escreveu; tudo o mais é o app falando. */}
      <Text
        className="font-serif text-[17px] leading-7 text-ink"
        selectable
      >
        {pedido.descricaoPedido}
      </Text>

      {/* ── A assinatura ─────────────────────────────────────────────
          Avatar de 24, não de 40. Quem pediu importa, mas depois do que foi
          pedido — e o tamanho é o que diz em que ordem ler. */}
      <View className="flex-row items-center gap-sm">
        <Avatar nome={pedido.autor.nomeCompleto} fotoUrl={pedido.autor.fotoUrl} size={24} />

        <Text className="flex-shrink font-sans-medium text-[13px] text-ink" numberOfLines={1}>
          {/* "Você" no lugar do nome, em vez de um selo ao lado dele.
              O selo era `bg-gold-soft` com `text-on-secondary-soft` — par
              trocado, 2,09:1 no tema escuro. Trocar a palavra resolve o
              contraste E remove um elemento da linha. */}
          {ehMeu ? 'Você' : pedido.autor.nomeCompleto || 'Membro da igreja'}
        </Text>

        {ehLideranca && !ehMeu ? (
          <Text className="font-sans-semibold text-[13px] text-secondary">
            {pedido.autor.perfil}
          </Text>
        ) : null}

        <Text className="font-sans text-[13px] text-ink-muted">
          · {formatRelativeTime(pedido.dataEnvio)}
        </Text>

        <View className="ml-auto flex-row items-center gap-lg">
          {/*
            ═══ DENUNCIAR E BLOQUEAR ═══
            Só em pedido de OUTRA pessoa. No próprio já existe a lixeira, e
            denunciar o que você mesmo escreveu só criaria fila de trabalho
            para a liderança resolver algo que você resolve num toque.

            Três pontinhos em vez de dois ícones soltos: são ações raras e
            sérias, e mantê-las atrás de um menu evita o toque acidental ao
            lado do "Vou orar", que é o botão que a pessoa realmente procura.
          */}
          {!ehMeu ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Mais opções sobre o pedido de ${pedido.autor.nomeCompleto || 'outro membro'}`}
              hitSlop={13}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
              onPress={onMaisOpcoes}
            >
              <MaterialCommunityIcons
                name="dots-horizontal"
                size={18}
                color={colors.inkMuted}
              />
            </Pressable>
          ) : null}

          {podeExcluir ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                ehMeu
                  ? 'Excluir o seu pedido'
                  : `Excluir o pedido de ${pedido.autor.nomeCompleto || 'outro membro'}`
              }
              // 18 de glifo + 13 de folga = 44 de alvo.
              hitSlop={13}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
              onPress={onExcluir}
            >
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={18}
                // Vermelho só quando é moderação — apagar o pedido de outra
                // pessoa é um ato diferente de apagar o seu.
                color={ehMeu ? colors.inkMuted : colors.error}
              />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* ── A resposta ───────────────────────────────────────────────
          UMA ação com peso, e não duas pílulas iguais. "Vou orar" é
          compromisso; "Amém" é concordância — parecidas o bastante para que
          duas pílulas idênticas façam a pessoa escolher entre sinônimos.
          Com hierarquia, a leitura vira: comprometo-me, e de passagem
          concordo. */}
      <View className="flex-row items-center gap-lg">
        <PilulaOrar ativo={reacao.praying} onPress={() => onReagir('praying')} />

        {/* ═══ O DOURADO NÃO PODE CARREGAR ESTE ESTADO ═══
            O caminho óbvio era pintar o "Amém" ativo de dourado. Só que o
            `gold` da paleta dá 2,96:1 sobre o card branco — reprova até no
            piso de 3:1 de texto grande. E o `gold-fixed` como fundo dá 1,19:1
            contra o branco: a pílula existiria sem que ninguém visse a borda
            dela. O dourado desta paleta serve para fundo tingido, não para
            tinta sobre claro; é a mesma restrição que já tirou o dourado dos
            ícones da TopBar.

            Então o estado vira FORMA, não matiz: inativo é texto solto;
            ativo é uma pastilha cheia em `secondary`. Muda a silhueta, e não
            só a cor — o que também atende quem não distingue as duas. */}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: reacao.amen }}
          accessibilityLabel={reacao.amen ? 'Você disse amém' : 'Dizer amém a este pedido'}
          onPress={() => onReagir('amen')}
          hitSlop={8}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              minHeight: ALTURA_PILULA,
              // ═══ O PADDING NÃO MUDA MAIS COM O ESTADO ═══
              // Era `reacao.amen ? spacing.lg : 0`. Alternar mudava a LARGURA
              // da view, e no Android essa mudança junto com a troca de fundo
              // era o que fazia o arredondamento se perder.
              //
              // De quebra some o pulo: o botão parava de mudar de tamanho a
              // cada toque, empurrando o que está do lado.
              paddingHorizontal: spacing.lg,
              borderRadius: ALTURA_PILULA / 2,
              // Garante o recorte mesmo se o Android reaproveitar o fundo
              // anterior — é o cinto de segurança do arredondamento.
              overflow: 'hidden',
              backgroundColor: reacao.amen ? colors.secondary : 'transparent',
            }}
          >
            <MaterialCommunityIcons
              name="hands-pray"
              size={17}
              color={reacao.amen ? colors.onSecondary : colors.inkMuted}
            />
            <Text
              className="font-sans-semibold text-[14px]"
              style={{ color: reacao.amen ? colors.onSecondary : colors.inkMuted }}
            >
              Amém
            </Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

/**
 * O compromisso de orar.
 *
 * Toda a aparência mora numa `View` filha, e o `Pressable` só mexe na
 * opacidade — ver o comentário do topo do arquivo. Aqui isso não é higiene:
 * era o estado ATIVO que estava no `className`.
 */
function PilulaOrar({ ativo, onPress }: { ativo: boolean; onPress: () => void }) {
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: ativo }}
      accessibilityLabel={
        ativo
          ? 'Você marcou que está orando por este pedido'
          : 'Marcar que vou orar por este pedido'
      }
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          minHeight: ALTURA_PILULA,
          paddingHorizontal: spacing.lg,
          // Metade da altura, e não `radius.full`. Ver o comentário de
          // `ALTURA_PILULA` — este aqui não chegou a quebrar (a borda de 1px
          // segurava o desenho), mas depender disso é sorte, não projeto.
          borderRadius: ALTURA_PILULA / 2,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: ativo ? colors.success : colors.outlineVariant,
          backgroundColor: ativo ? colors.success : 'transparent',
        }}
      >
        <MaterialCommunityIcons
          name={ativo ? 'hand-heart' : 'hand-heart-outline'}
          size={17}
          color={ativo ? colors.onSuccess : colors.ink}
        />
        <Text
          className="font-sans-semibold text-[14px]"
          style={{ color: ativo ? colors.onSuccess : colors.ink }}
        >
          {ativo ? 'Orando' : 'Vou orar'}
        </Text>
      </View>
    </Pressable>
  );
}
