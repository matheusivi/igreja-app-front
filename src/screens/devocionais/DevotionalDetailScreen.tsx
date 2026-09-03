import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, LeitorBlocos } from '../../components';
import { tracking } from '../../constants/theme';
import { useThemeColors } from '../../hooks/useThemeColors';
import type { AppStackParamList } from '../../navigation/types';
import { useConteudo, useExcluirConteudo } from '../../hooks/queries/useConteudos';
import { useAlternarLeitura, useLeituras } from '../../hooks/queries/useLeituras';
import {
  ESCALAS,
  useAlterarTamanhoLeitura,
  useTamanhoLeitura,
  type EscalaLeitura,
} from '../../hooks/queries/useTamanhoLeitura';
import { extractErrorMessage } from '../../services/api';
import { tempoDeLeitura } from '../../services/content.service';
import { urlImagem } from '../../services/imagem';
import { useAuth } from '../../navigation/AuthContext';

/**
 * Tela de LEITURA. As decisões aqui são diferentes de qualquer outra do app,
 * porque o objetivo também é: ninguém "usa" esta tela — a pessoa lê.
 *
 * ═══ CAPA COMO ABERTURA ═══
 * Quando o conteúdo tem imagem, a primeira delas sangra até as bordas no topo
 * e o texto começa depois. Antes ela era só mais um bloco no meio do fluxo,
 * com margem dos dois lados como um parágrafo. Imagem de abertura estabelece
 * o assunto antes da primeira palavra; imagem no meio do texto interrompe.
 *
 * ═══ CONTROLE DE TAMANHO ═══
 * Três tamanhos, guardados no aparelho. É o recurso mais valioso desta tela
 * para uma congregação com idosos, e o mais barato de fazer. O ajuste do
 * sistema operacional já existe, mas quase ninguém sabe — e quem sabe não
 * quer aumentar a fonte do aparelho inteiro por causa do devocional.
 *
 * ═══ TEMPO DE LEITURA ═══
 * "3 min de leitura" antes do primeiro parágrafo. Parede de texto sem
 * indicação faz a pessoa rolar até o fim para decidir se começa, e boa parte
 * fecha antes disso.
 *
 * ═══ BARRA DE PROGRESSO ═══
 * Fio de 2px no topo. Serve para a mesma coisa que o tempo, só que durante:
 * saber quanto falta é o que sustenta a leitura longa. Custa um cálculo por
 * quadro de rolagem e nenhum pixel de layout.
 *
 * ═══ MARCAR COMO LIDO NO FIM ═══
 * O botão fica depois do texto, não antes. Marcar como lido é ação de QUEM
 * TERMINOU — colocá-la no topo convida a marcar sem ler, e o dado deixa de
 * significar qualquer coisa.
 */

type Props = NativeStackScreenProps<AppStackParamList, 'DevocionalDetail'>;

export function DevotionalDetailScreen({ route, navigation }: Props) {
  const colors = useThemeColors();
  const { user } = useAuth();

  const {
    data: conteudo,
    isPending: isLoading,
    error: queryError,
  } = useConteudo(route.params.id);

  const excluirConteudo = useExcluirConteudo();
  const error = queryError ? extractErrorMessage(queryError) : null;

  const escala = useTamanhoLeitura();
  const alterarTamanho = useAlterarTamanhoLeitura();

  const lidos = useLeituras();
  const alternarLeitura = useAlternarLeitura();
  const foiLido = !!conteudo && lidos.has(conteudo.id);

  const [progresso, setProgresso] = useState(0);

  // A tela serve devocional e aviso — ambos são "conteúdo" para o backend.
  // "Marcar como lido" só faz sentido em material de estudo, não em
  // comunicado; e comunicado se varre, então não leva serifada.
  const ehAviso = conteudo?.tipo === 'Aviso';
  const blocos = useMemo(() => conteudo?.blocos ?? [], [conteudo]);

  /**
   * A primeira imagem vira capa e sai do corpo do texto.
   *
   * Só quando ela é o PRIMEIRO bloco: se o autor escreveu dois parágrafos e
   * então colocou uma foto, aquela foto ilustra o trecho e tirá-la dali
   * quebraria o raciocínio.
   */
  const capa = blocos[0]?.tipo === 'imagem' ? blocos[0]!.valor : null;
  const corpo = capa ? blocos.slice(1) : blocos;

  const minutos = useMemo(() => tempoDeLeitura(corpo), [corpo]);

  const podeGerenciar =
    !!conteudo &&
    (conteudo.autor.id === user?.id ||
      ['Pastor', 'Administrador'].includes(user?.perfil ?? ''));

  function aoRolar(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const rolavel = contentSize.height - layoutMeasurement.height;
    // Conteúdo que cabe na tela não tem progresso a mostrar — sem a guarda,
    // a divisão por zero deixaria a barra cheia desde o início.
    setProgresso(rolavel > 0 ? Math.min(1, Math.max(0, contentOffset.y / rolavel)) : 0);
  }

  function confirmarExclusao() {
    if (!conteudo) return;
    Alert.alert(
      'Excluir conteúdo',
      'Tem certeza que deseja excluir? Essa ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () =>
            excluirConteudo.mutate(conteudo.id, {
              onSuccess: () => navigation.goBack(),
              onError: (e) =>
                Alert.alert('Erro', extractErrorMessage(e, 'Não foi possível excluir.')),
            }),
        },
      ],
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      {/* ── Barra de progresso ──────────────────────────────────────── */}
      <View style={{ height: 2, backgroundColor: colors.outlineVariant }}>
        <View
          style={{
            height: 2,
            width: `${progresso * 100}%`,
            backgroundColor: colors.primary,
          }}
        />
      </View>

      {/* ── Topo ────────────────────────────────────────────────────── */}
      <View className="h-14 flex-row items-center justify-between bg-background px-gutter">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={({ pressed }) => pressed && { opacity: 0.6 }}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.ink} />
        </Pressable>

        <View className="flex-row items-center gap-lg">
          {!ehAviso ? (
            <ControleTamanho
              escala={escala}
              onMudar={(e) => alterarTamanho.mutate(e)}
            />
          ) : null}

          {podeGerenciar ? (
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Editar conteúdo"
                onPress={() =>
                  navigation.navigate('CreateConteudo', { id: String(conteudo!.id) })
                }
                hitSlop={12}
                style={({ pressed }) => pressed && { opacity: 0.6 }}
              >
                <MaterialCommunityIcons
                  name="pencil-outline"
                  size={21}
                  color={colors.secondary}
                />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Excluir conteúdo"
                onPress={confirmarExclusao}
                hitSlop={12}
                style={({ pressed }) => pressed && { opacity: 0.6 }}
              >
                <MaterialCommunityIcons
                  name="trash-can-outline"
                  size={21}
                  color={colors.error}
                />
              </Pressable>
            </>
          ) : null}
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center bg-background">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error || !conteudo ? (
        <View className="flex-1 items-center justify-center gap-md bg-background px-gutter">
          <Text className="text-center font-sans text-sm text-ink-muted">
            {error ?? 'Conteúdo não encontrado.'}
          </Text>
          <Button
            label="Voltar"
            variant="secondary"
            fullWidth={false}
            onPress={() => navigation.goBack()}
          />
        </View>
      ) : (
        <ScrollView
          className="flex-1 bg-background"
          onScroll={aoRolar}
          scrollEventThrottle={32}
          contentContainerClassName="pb-3xl"
        >
          {/* Capa sangrando até as bordas — ela abre o assunto antes da
              primeira palavra. Ver o comentário do topo. */}
          {capa ? (
            <Image
              source={{ uri: urlImagem(capa, { largura: 393, altura: 221 }) }}
              className="w-full"
              style={{ aspectRatio: 16 / 9 }}
              resizeMode="cover"
              accessible={false}
            />
          ) : null}

          <View className="gap-xl px-gutter pt-xl">
            {/* ── Cabeçalho do texto ──────────────────────────────── */}
            <View className="gap-md">
              <View className="flex-row items-center gap-md">
                <Text
                  className="font-sans-semibold text-[11px] uppercase text-secondary"
                  style={{ letterSpacing: tracking.overline }}
                >
                  {conteudo.tipo}
                </Text>
                {!ehAviso ? (
                  <>
                    <View
                      style={{
                        width: 3,
                        height: 3,
                        borderRadius: 2,
                        backgroundColor: colors.inkMuted,
                      }}
                    />
                    <Text className="font-sans text-[13px] text-ink-muted">
                      {minutos} min de leitura
                    </Text>
                  </>
                ) : null}
              </View>

              <Text
                accessibilityRole="header"
                className="font-serif-bold text-[28px] leading-9 text-ink"
                style={{ letterSpacing: tracking.title }}
              >
                {conteudo.titulo}
              </Text>

              {/* Autor e data numa linha só, com fio embaixo. É metadado —
                  precisa estar disponível e sair da frente do texto. */}
              <View className="flex-row items-center gap-sm border-b border-outline-variant pb-lg">
                <MaterialCommunityIcons
                  name="account-outline"
                  size={16}
                  color={colors.inkMuted}
                />
                <Text className="font-sans-medium text-[13px] text-ink">
                  {conteudo.autor.nomeCompleto}
                </Text>
                <Text className="ml-auto font-sans text-[13px] text-ink-muted">
                  {new Date(conteudo.dataPublicacao).toLocaleDateString('pt-BR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            </View>

            {/* ── Corpo ───────────────────────────────────────────── */}
            <LeitorBlocos blocos={corpo} escala={escala} serifado={!ehAviso} />

            {/* ── Fim ─────────────────────────────────────────────── */}
            {!ehAviso ? (
              <View className="gap-lg border-t border-outline-variant pt-xl">
                <Text className="text-center font-serif text-[15px] italic leading-6 text-ink-muted">
                  Que esta palavra frutifique na sua semana.
                </Text>
                <Button
                  label={foiLido ? 'Lido' : 'Marcar como lido'}
                  // Alterna em vez de só marcar: quem tocou sem querer
                  // consegue desfazer, e quem quer reler pode limpar.
                  variant={foiLido ? 'secondary' : 'primary'}
                  icon={
                    <MaterialCommunityIcons
                      name={foiLido ? 'check-circle' : 'check-circle-outline'}
                      size={19}
                      color={foiLido ? colors.ink : colors.onPrimary}
                    />
                  }
                  onPress={() => alternarLeitura.mutate(conteudo.id)}
                />
              </View>
            ) : null}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

/* ────────────────────────────────────────────────────────────────────── */

/**
 * Três tamanhos, representados pelo próprio tamanho da letra.
 *
 * O "A" de cada botão cresce junto com a escala que ele aplica — o controle
 * demonstra o que faz antes de ser tocado, em vez de depender de um rótulo
 * "pequeno / médio / grande" que ocuparia o triplo do espaço.
 */
function ControleTamanho({
  escala,
  onMudar,
}: {
  escala: EscalaLeitura;
  onMudar: (e: EscalaLeitura) => void;
}) {
  const colors = useThemeColors();
  const rotulos = ['Texto pequeno', 'Texto médio', 'Texto grande'];

  return (
    <View className="flex-row items-center overflow-hidden rounded-md bg-surface-dim">
      {ESCALAS.map((valor, i) => {
        const ativo = escala === valor;
        return (
          <Pressable
            key={valor}
            accessibilityRole="button"
            accessibilityState={{ selected: ativo }}
            accessibilityLabel={rotulos[i]}
            onPress={() => onMudar(valor)}
            /* 34pt de altura visível, 50 de alvo. O `hitSlop` cresce só na
               vertical: na horizontal os três segmentos são vizinhos, e
               folga lateral faria as áreas se sobreporem — o toque na borda
               acionaria o segmento errado. */
            hitSlop={{ top: 8, bottom: 8 }}
            style={({ pressed }) => [
              {
                width: 34,
                height: 34,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: ativo ? colors.primary : 'transparent',
              },
              pressed && !ativo && { opacity: 0.6 },
            ]}
          >
            <Text
              style={{
                fontFamily: 'SourceSerif4_700Bold',
                fontSize: 11 + i * 3,
                color: ativo ? colors.onPrimary : colors.inkMuted,
              }}
            >
              A
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
