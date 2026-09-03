import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TopBar } from '../../components';
import {
  MESES,
  anoPadrao,
  anosDisponiveis,
  leiturasDoMes,
  leituraDeHoje,
  totalDeLeituras,
  type DiaDoPlano,
} from '../../constants/planoLeitura';
import { radius, spacing } from '../../constants/theme';
import {
  useMarcarLeitura,
  useProgressoLeitura,
} from '../../hooks/queries/usePlanoLeitura';
import { useThemeColors } from '../../hooks/useThemeColors';
import type { AppStackParamList } from '../../navigation/types';
import { extractErrorMessage } from '../../services/api';

type Props = NativeStackScreenProps<AppStackParamList, 'PlanoLeitura'>;

/**
 * O plano de leitura anual.
 *
 * ═══ TRÊS CAMADAS, DA MAIS URGENTE PARA A MENOS ═══
 * 1. O QUE LER HOJE — é a pergunta que traz 9 em cada 10 visitas. Fica no
 *    topo, com o botão de marcar do tamanho de um botão de verdade.
 * 2. QUANTO JÁ ANDEI — o número que sustenta a prática nos meses em que a
 *    novidade passou. Uma barra, não uma tabela.
 * 3. O ANO INTEIRO — para conferir, adiantar ou recuperar atraso.
 *
 * A ordem inversa (calendário primeiro) faria a pessoa procurar o próprio dia
 * numa grade de 365 toda manhã — trabalho diário para uma resposta que o app
 * já sabe.
 *
 * ═══ NÃO EXISTE "ATRASADO" ═══
 * Dias passados sem marcar ficam neutros, sem vermelho nem alerta. Um plano
 * de leitura que cobra abandona mais gente do que segura: quem pulou uma
 * semana em maio e abre o app vendo sete acusações fecha o app.
 *
 * Marcar dias futuros também é livre — quem lê adiantado no domingo marca a
 * semana, e travar isso serviria a uma noção de disciplina que não é a nossa.
 */
export function PlanoLeituraScreen({ navigation }: Props) {
  const colors = useThemeColors();
  const hoje = leituraDeHoje();

  /**
   * Os anos que a tela oferece: o corrente e o anterior.
   *
   * A lista vem do arquivo de planos, já cortada — ano futuro não aparece, e
   * o mais antigo sai sozinho quando um novo entra. Ver `anosDisponiveis`.
   */
  const anos = anosDisponiveis();
  const [ano, setAno] = useState(anoPadrao() ?? new Date().getFullYear());

  // Abre no mês corrente quando o ano escolhido é o de hoje; nos outros, em
  // janeiro — em dezembro do ano passado ninguém quer começar por dezembro.
  const [mesAberto, setMesAberto] = useState(hoje?.mes ?? 1);

  const { concluidos, carregando, erro } = useProgressoLeitura(ano);
  const marcar = useMarcarLeitura(ano);
  const listaMeses = useRef<ScrollView>(null);

  const totalDoAno = totalDeLeituras(ano);
  const total = concluidos.size;
  const percentual = totalDoAno > 0 ? Math.round((total / totalDoAno) * 100) : 0;

  /**
   * Trocar de ano volta para janeiro — a não ser que seja o ano corrente,
   * onde o mês de hoje é o lugar certo de continuar.
   */
  function trocarAno(novo: number) {
    setAno(novo);
    setMesAberto(novo === hoje?.ano ? hoje.mes : 1);
  }

  function alternar(dia: DiaDoPlano) {
    marcar.mutate({ dia: dia.chave, concluido: !concluidos.has(dia.chave) });
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <TopBar title="Plano de leitura" onBack={() => navigation.goBack()} />

      {carregando ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          className="flex-1 bg-background"
          contentContainerClassName="gap-lg pb-3xl"
        >
          {erro ? (
            <Text className="px-gutter font-sans text-[13px] text-error">
              {extractErrorMessage(erro, 'Não foi possível carregar o seu progresso.')}
            </Text>
          ) : null}

          {/* ── 1. Hoje ─────────────────────────────────────────────── */}
          {hoje && ano === hoje.ano ? (
            <CartaoDeHoje
              dia={hoje}
              concluido={concluidos.has(hoje.chave)}
              onAlternar={() => alternar(hoje)}
            />
          ) : null}

          {/* ── 2. Progresso ────────────────────────────────────────── */}
          <View className="gap-sm px-gutter">
            <View className="flex-row items-center justify-between">
              {/* Com um ano só, o número é rótulo. Com dois, vira escolha —
                  e um seletor de UMA opção é botão que não faz nada. */}
              {anos.length > 1 ? (
                <View className="flex-row gap-sm">
                  {anos.map((a) => (
                    <ChipAno
                      key={a}
                      ano={a}
                      ativo={a === ano}
                      onPress={() => trocarAno(a)}
                    />
                  ))}
                </View>
              ) : (
                <Text className="font-serif-bold text-[15px] text-ink">{ano}</Text>
              )}

              <Text className="font-sans text-[13px] text-ink-muted">
                {total} de {totalDoAno} dias · {percentual}%
              </Text>
            </View>

            {/* Barra e não anel: a comparação aqui é "quanto falta do ano", e
                uma linha reta lida da esquerda para a direita responde isso
                sem que ninguém precise interpretar um arco. */}
            <View
              accessibilityRole="progressbar"
              accessibilityValue={{ min: 0, max: totalDoAno, now: total }}
              style={{
                height: 8,
                borderRadius: 4,
                overflow: 'hidden',
                backgroundColor: colors.surfaceContainerHigh,
              }}
            >
              <View
                style={{
                  // `%` e não largura calculada: a barra acompanha a tela sem
                  // precisar medir nada.
                  width: `${Math.min(percentual, 100)}%`,
                  height: '100%',
                  backgroundColor: colors.success,
                }}
              />
            </View>
          </View>

          {/* ── 3. Os meses ─────────────────────────────────────────── */}
          <View className="gap-md">
            <ScrollView
              ref={listaMeses}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: spacing.gutter,
                gap: spacing.sm,
              }}
            >
              {MESES.map((nome, i) => (
                <ChipMes
                  key={nome}
                  nome={nome}
                  ativo={mesAberto === i + 1}
                  ehMesDeHoje={ano === hoje?.ano && hoje.mes === i + 1}
                  onPress={() => setMesAberto(i + 1)}
                />
              ))}
            </ScrollView>

            <View className="px-gutter">
              {leiturasDoMes(ano, mesAberto).map((dia) => (
                <LinhaDia
                  key={dia.chave}
                  dia={dia}
                  concluido={concluidos.has(dia.chave)}
                  ehHoje={hoje?.chave === dia.chave}
                  onPress={() => alternar(dia)}
                />
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

/**
 * A leitura do dia, em destaque.
 *
 * O botão é largo e escrito por extenso porque esta é a ação que a pessoa
 * veio fazer. Um quadradinho de marcar aqui trataria a tarefa principal com o
 * mesmo peso das outras trinta linhas da tela.
 *
 * ═══ O CARTÃO SEGUE O CALENDÁRIO, NÃO O PROGRESSO ═══
 * Quem abre em 12 de agosto vê Jeremias, não Gênesis 1 — mesmo sem ter lido
 * nada. É de propósito: um plano de igreja vale porque todo mundo lê a mesma
 * coisa no mesmo dia, e dá para comentar aquilo no culto de quarta. Um plano
 * que anda no ritmo de cada um é um plano particular, e aí a igreja perde a
 * conversa em comum.
 *
 * Houve aqui um parágrafo explicando isso a quem começa no meio do ano. Saiu
 * a pedido: o cartão é para a ação, e texto de apoio embaixo de um botão é
 * lido uma vez e ignorado nas outras trezentas. Se a dúvida aparecer na
 * prática, o lugar dela é uma tela de ajuda, não o caminho de todo dia.
 */
function CartaoDeHoje({
  dia,
  concluido,
  onAlternar,
}: {
  dia: DiaDoPlano;
  concluido: boolean;
  onAlternar: () => void;
}) {
  const colors = useThemeColors();

  return (
    <View
      className="mx-gutter gap-md p-lg"
      style={{
        borderRadius: radius.lg,
        backgroundColor: concluido ? colors.successSoft : colors.secondarySoft,
      }}
    >
      <Text
        className="font-sans-semibold text-[12px] uppercase tracking-wide"
        style={{ color: colors.onSecondarySoft, opacity: 0.75 }}
      >
        Leitura de hoje · {dia.dia} de {MESES[dia.mes - 1]}
      </Text>

      <Text
        className="font-serif-bold text-[24px] leading-8"
        style={{ color: colors.onSecondarySoft }}
      >
        {dia.leitura}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ checked: concluido }}
        accessibilityLabel={
          concluido ? 'Desmarcar a leitura de hoje' : 'Marcar a leitura de hoje como lida'
        }
        onPress={onAlternar}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        <View
          className="flex-row items-center justify-center gap-sm"
          style={{
            minHeight: 48,
            borderRadius: radius.button,
            backgroundColor: concluido ? 'transparent' : colors.success,
            borderWidth: concluido ? 1 : 0,
            borderColor: colors.success,
          }}
        >
          <MaterialCommunityIcons
            name={concluido ? 'check-circle' : 'circle-outline'}
            size={20}
            color={concluido ? colors.success : colors.onSuccess}
          />
          <Text
            className="font-sans-semibold text-[15px]"
            style={{ color: concluido ? colors.success : colors.onSuccess }}
          >
            {concluido ? 'Lida' : 'Marcar como lida'}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

/**
 * O seletor de ano.
 *
 * ═══ POR QUE CHIP, E NÃO UMA LISTA SUSPENSA ═══
 * São no máximo dois. Um menu para duas opções esconde uma delas atrás de um
 * toque e obriga a pessoa a descobrir que a escolha existe — com dois chips
 * lado a lado, ela vê os dois e entende sem abrir nada.
 *
 * Usa a mesma forma do chip de mês logo abaixo de propósito: são a mesma
 * natureza de escolha, uma dentro da outra, e formas diferentes sugeririam
 * que fazem coisas diferentes.
 */
function ChipAno({
  ano,
  ativo,
  onPress,
}: {
  ano: number;
  ativo: boolean;
  onPress: () => void;
}) {
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: ativo }}
      accessibilityLabel={`Plano de ${ano}`}
      onPress={onPress}
      hitSlop={{ top: 6, bottom: 6 }}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
    >
      <View
        className="px-md"
        style={{
          minHeight: 32,
          justifyContent: 'center',
          borderRadius: radius.md,
          backgroundColor: ativo ? colors.inverseSurface : colors.surfaceContainerHigh,
        }}
      >
        <Text
          className="font-serif-bold text-[14px]"
          style={{ color: ativo ? colors.inverseInk : colors.ink }}
        >
          {ano}
        </Text>
      </View>
    </Pressable>
  );
}

function ChipMes({
  nome,
  ativo,
  ehMesDeHoje,
  onPress,
}: {
  nome: string;
  ativo: boolean;
  ehMesDeHoje: boolean;
  onPress: () => void;
}) {
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: ativo }}
      accessibilityLabel={ehMesDeHoje ? `${nome}, mês atual` : nome}
      onPress={onPress}
      // O chip tem 38 de altura por estética; o `hitSlop` leva o alvo real a
      // 50. Chip de mês é alvo pequeno numa fileira que rola — errar a mira
      // aqui não só não seleciona, como arrasta a lista.
      hitSlop={{ top: 6, bottom: 6 }}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
    >
      <View
        className="flex-row items-center gap-1 px-md"
        style={{
          minHeight: 38,
          justifyContent: 'center',
          borderRadius: radius.md,
          backgroundColor: ativo ? colors.inverseSurface : colors.surfaceContainerHigh,
        }}
      >
        {/* Um ponto marca o mês corrente mesmo quando outro está aberto —
            senão, depois de navegar até setembro, não há nada dizendo onde
            fica "agora". */}
        {ehMesDeHoje ? (
          <View
            style={{
              width: 5,
              height: 5,
              borderRadius: 3,
              backgroundColor: ativo ? colors.inverseInk : colors.success,
            }}
          />
        ) : null}
        <Text
          className="font-sans-semibold text-[13px]"
          style={{ color: ativo ? colors.inverseInk : colors.ink }}
        >
          {nome}
        </Text>
      </View>
    </Pressable>
  );
}

/**
 * Um dia do mês.
 *
 * A linha INTEIRA é o alvo — 56 de altura, do número ao visto. Um quadradinho
 * de 20px na ponta seria o alvo de verdade, e errar a mira num gesto que se
 * repete todo dia vira irritação diária.
 */
function LinhaDia({
  dia,
  concluido,
  ehHoje,
  onPress,
}: {
  dia: DiaDoPlano;
  concluido: boolean;
  ehHoje: boolean;
  onPress: () => void;
}) {
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: concluido }}
      accessibilityLabel={`Dia ${dia.dia}, ${dia.leitura}`}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          minHeight: 56,
          paddingHorizontal: concluido ? spacing.sm : 0,
          borderRadius: concluido ? radius.sm : 0,
          backgroundColor: concluido ? colors.successSoft : 'transparent',
          borderBottomWidth: concluido ? 0 : 1,
          borderBottomColor: colors.outlineVariant,
        }}
      >
        {/* O número do dia em largura fixa: sem isso "9" e "30" desalinham os
            títulos, e a coluna de leituras fica serrilhada. */}
        <Text
          className="font-sans-semibold text-[15px]"
          style={{
            width: 26,
            textAlign: 'center',
            color: ehHoje ? colors.success : colors.inkMuted,
          }}
        >
          {dia.dia}
        </Text>

        <Text
          className="flex-1 font-sans text-[15px]"
          style={{ color: colors.ink }}
          numberOfLines={1}
        >
          {dia.leitura}
        </Text>

        <MaterialCommunityIcons
          name={concluido ? 'check-circle' : 'circle-outline'}
          size={22}
          color={concluido ? colors.success : colors.outline}
        />
      </View>
    </Pressable>
  );
}
