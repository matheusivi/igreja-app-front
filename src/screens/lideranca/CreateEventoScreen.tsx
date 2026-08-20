import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ImagePickerField, TextField, TopBar } from '../../components';
import { tracking } from '../../constants/theme';
import { useThemeColors } from '../../hooks/useThemeColors';
import type { AppStackParamList } from '../../navigation/types';
import { extractErrorMessage } from '../../services/api';
import {
  eventsService,
  type CreateEventoPayload,
  type EventoItem,
} from '../../services/events.service';
import { useCreateEvento, useUpdateEvento } from '../../hooks/queries/useEventos';
import { isValidDate, isValidTime, maskDate, maskTime } from '../../utils/masks';

/**
 * Formulário de evento.
 *
 * ═══ O QUE SAIU, E POR QUÊ ═══
 *
 * **Recorrência mensal.** O campo era `diaDoMes` — "todo dia 15". Isso é bem
 * definido, mas NÃO é o que a igreja precisa: o culto de homens é na "última
 * terça do mês", que é recorrência POSICIONAL (n-ésimo dia da semana), coisa
 * diferente. Oferecer mensal por dia fixo daria a impressão de resolver e
 * produziria datas erradas todo mês. Meia solução em agenda é pior que
 * nenhuma, porque a pessoa confia nela.
 *
 * Se um dia a igreja precisar de "última terça", o caminho é um campo
 * `semanaDoMes` (1ª, 2ª, 3ª, 4ª, última) somado ao `diaSemana` que já existe
 * — e aí a frase de confirmação diz exatamente o que vai acontecer.
 *
 * **Cor do evento.** Cinco bolinhas para escolher uma cor que aparecia como
 * um ponto de 8px no card. Um enfeite que pedia uma decisão a cada evento
 * criado e não mudava nada na leitura. O `tipo` já diferencia, e ele carrega
 * significado — cor não carregava.
 *
 * ═══ A ORGANIZAÇÃO ═══
 * Antes eram nove campos empilhados no mesmo peso, cada um com seu rótulo em
 * versalete solto. Formulário longo sem hierarquia obriga a pessoa a ler tudo
 * para achar o que falta.
 *
 * Agora são três seções nomeadas, na ordem em que a informação existe na
 * cabeça de quem cria:
 *
 *   1. O QUE É       título, tipo
 *   2. QUANDO        data, hora, repetição
 *   3. DETALHES      local, descrição, capa, destaque
 *
 * O obrigatório está inteiro nas duas primeiras. Quem quer só marcar a data
 * do culto de domingo preenche quatro campos e sai.
 */

type Props = NativeStackScreenProps<AppStackParamList, 'CreateEvento'>;

const TIPOS: EventoItem['tipo'][] = ['Culto', 'Reunião', 'Retiro', 'Conferência', 'Outro'];

/** Só `nenhuma` e `semanal`. Ver a explicação do mensal no topo do arquivo. */
const RECORRENCIAS: { valor: CreateEventoPayload['recorrencia']; label: string }[] = [
  { valor: 'nenhuma', label: 'Uma vez só' },
  { valor: 'semanal', label: 'Toda semana' },
];

const DIAS_SEMANA = [
  'domingo', 'segunda-feira', 'terça-feira', 'quarta-feira',
  'quinta-feira', 'sexta-feira', 'sábado',
];

/**
 * Frase que descreve o que a recorrência vai gerar.
 *
 * Existe porque o dia da semana deixou de ser perguntado — ele sai da data.
 * Sem esta frase, a pessoa escolheria "toda semana" e só descobriria em qual
 * dia caiu depois de salvar.
 */
function resumoRecorrencia(dataStr: string): string {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dataStr.trim());
  if (!m) return '';
  const [, d, mes, ano] = m;
  const data = new Date(Number(ano), Number(mes) - 1, Number(d));
  return `Vai se repetir toda ${DIAS_SEMANA[data.getDay()]}, a partir de ${d}/${mes}.`;
}

function buildISO(dateStr: string, timeStr: string): string | null {
  if (!isValidDate(dateStr) || !isValidTime(timeStr)) return null;
  const dateMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dateStr.trim());
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(timeStr.trim());
  if (!dateMatch || !timeMatch) return null;
  const [, d, m, y] = dateMatch;
  const [, h, min] = timeMatch;
  const date = new Date(`${y}-${m}-${d}T${h}:${min}:00`);
  if (isNaN(date.getTime())) return null;
  return date.toISOString();
}

function isoToDateStr(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function isoToTimeStr(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function CreateEventoScreen({ route, navigation }: Props) {
  const colors = useThemeColors();
  const editId = route.params?.id;
  const isEditing = !!editId;

  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState<EventoItem['tipo']>('Culto');
  const [dataStr, setDataStr] = useState('');
  const [horaStr, setHoraStr] = useState('');
  const [local, setLocal] = useState('');
  const [descricao, setDescricao] = useState('');
  const [recorrencia, setRecorrencia] =
    useState<CreateEventoPayload['recorrencia']>('nenhuma');
  const [destaqueHome, setDestaqueHome] = useState(false);
  const [imagemUrl, setImagemUrl] = useState<string | null>(null);
  const [isLoadingEvento, setIsLoadingEvento] = useState(isEditing);
  const [error, setError] = useState<string | null>(null);

  const createEvento = useCreateEvento();
  const updateEvento = useUpdateEvento();
  const isLoading = createEvento.isPending || updateEvento.isPending;

  useEffect(() => {
    if (!editId) return;
    async function load() {
      setIsLoadingEvento(true);
      try {
        const evento = await eventsService.getEvento(editId!);
        setTitulo(evento.titulo);
        setTipo(evento.tipo);
        setDataStr(isoToDateStr(evento.dataInicio));
        setHoraStr(isoToTimeStr(evento.dataInicio));
        setLocal(evento.local ?? '');
        setDescricao(evento.descricao ?? '');
        // Evento antigo gravado como "mensal" cai em "uma vez só" ao ser
        // editado: o modo deixou de existir, e manter um valor que a tela não
        // sabe representar deixaria o formulário mentindo sobre o estado.
        setRecorrencia(evento.recorrencia === 'semanal' ? 'semanal' : 'nenhuma');
        setDestaqueHome(!!evento.destaqueHome);
        setImagemUrl(evento.imagemUrl ?? null);
      } catch (e) {
        setError(extractErrorMessage(e, 'Não foi possível carregar o evento.'));
      } finally {
        setIsLoadingEvento(false);
      }
    }
    load();
  }, [editId]);

  /** Diz o QUE falta, em vez de só desabilitar o botão em silêncio. */
  function missingHint(): string | null {
    if (!titulo.trim()) return 'Informe o título do evento.';
    if (!dataStr.trim()) return 'Informe a data do evento.';
    if (!isValidDate(dataStr)) return 'Data inválida. Use o formato DD/MM/AAAA.';
    if (!horaStr.trim()) return 'Informe o horário do evento.';
    if (!isValidTime(horaStr)) return 'Horário inválido. Use o formato HH:MM (ex: 19:30).';
    return null;
  }

  async function handleSubmit() {
    // Trava contra duplo toque: sem isso, dois toques rápidos antes do
    // primeiro request terminar criavam dois eventos iguais.
    if (isLoading) return;

    setError(null);
    const iso = buildISO(dataStr, horaStr);
    if (!iso) {
      setError('Data ou hora inválida. Use DD/MM/AAAA e HH:MM.');
      return;
    }

    const payload: CreateEventoPayload = {
      titulo: titulo.trim(),
      dataInicio: iso,
      tipo,
      recorrencia,
      destaqueHome,
      // Sempre enviado na edição: é o que permite REMOVER a capa.
      imagemUrl,
      ...(local.trim() ? { local: local.trim() } : {}),
      ...(descricao.trim() ? { descricao: descricao.trim() } : {}),
      // Derivado da própria data — não há como discordar dela.
      ...(recorrencia === 'semanal' ? { diaSemana: new Date(iso).getDay() } : {}),
    };

    const onError = (e: unknown) =>
      setError(
        extractErrorMessage(
          e,
          isEditing
            ? 'Não foi possível salvar as alterações.'
            : 'Não foi possível criar o evento.',
        ),
      );

    if (isEditing) {
      updateEvento.mutate(
        { id: Number(editId), payload },
        { onSuccess: () => navigation.goBack(), onError },
      );
    } else {
      createEvento.mutate(payload, { onSuccess: () => navigation.goBack(), onError });
    }
  }

  if (isLoadingEvento) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const faltando = missingHint();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <TopBar
        title={isEditing ? 'Editar evento' : 'Novo evento'}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        className="flex-1 bg-background px-gutter"
        contentContainerClassName="gap-2xl py-xl"
        keyboardShouldPersistTaps="handled"
      >
        {/* ═══ 1. O QUE É ═══════════════════════════════════════════ */}
        <Secao titulo="O que é" numero={1}>
          <TextField
            label="Título *"
            placeholder="Ex: Culto de celebração"
            value={titulo}
            onChangeText={(v) => {
              setTitulo(v);
              setError(null);
            }}
          />

          <Campo rotulo="Tipo">
            <View className="flex-row flex-wrap gap-sm">
              {TIPOS.map((t) => (
                <Opcao key={t} label={t} ativo={tipo === t} onPress={() => setTipo(t)} />
              ))}
            </View>
          </Campo>
        </Secao>

        {/* ═══ 2. QUANDO ════════════════════════════════════════════ */}
        <Secao titulo="Quando" numero={2}>
          <View className="flex-row gap-md">
            <View className="flex-1">
              <TextField
                label="Data *"
                placeholder="DD/MM/AAAA"
                value={dataStr}
                onChangeText={(v) => {
                  setDataStr(maskDate(v));
                  setError(null);
                }}
                keyboardType="numeric"
                maxLength={10}
              />
            </View>
            <View style={{ width: 116 }}>
              <TextField
                label="Hora *"
                placeholder="HH:MM"
                value={horaStr}
                onChangeText={(v) => {
                  setHoraStr(maskTime(v));
                  setError(null);
                }}
                keyboardType="numeric"
                maxLength={5}
              />
            </View>
          </View>

          <Campo rotulo="Repetição">
            <View className="flex-row gap-sm">
              {RECORRENCIAS.map((r) => (
                <Opcao
                  key={r.valor}
                  label={r.label}
                  ativo={recorrencia === r.valor}
                  onPress={() => setRecorrencia(r.valor)}
                />
              ))}
            </View>
          </Campo>

          {/* A repetição ANUNCIA o que vai fazer, em vez de pedir o dia da
              semana de novo. É o que permite perceber o engano antes de
              salvar, agora que só existe uma fonte: a data. */}
          {recorrencia === 'semanal' && isValidDate(dataStr) ? (
            <View className="flex-row items-start gap-md rounded-md bg-secondary-soft px-lg py-md">
              <MaterialCommunityIcons
                name="repeat"
                size={17}
                color={colors.onSecondarySoft}
                style={{ marginTop: 1 }}
              />
              <Text className="flex-1 font-sans text-[13px] leading-5 text-on-secondary-soft">
                {resumoRecorrencia(dataStr)}
              </Text>
            </View>
          ) : null}

          {recorrencia === 'semanal' && !isValidDate(dataStr) ? (
            <Text className="font-sans text-[13px] leading-5 text-ink-muted">
              Preencha a data para ver em qual dia da semana o evento vai se repetir.
            </Text>
          ) : null}
        </Secao>

        {/* ═══ 3. DETALHES ══════════════════════════════════════════ */}
        <Secao titulo="Detalhes" numero={3} opcional>
          <TextField
            label="Local"
            placeholder="Ex: Templo principal"
            value={local}
            onChangeText={setLocal}
          />

          <TextField
            label="Descrição"
            placeholder="O que vai acontecer, quem é o preletor, o que levar..."
            value={descricao}
            onChangeText={setDescricao}
            multiline
            numberOfLines={4}
          />

          <ImagePickerField
            label="Capa do evento"
            pasta="eventos"
            value={imagemUrl}
            onChange={(url) => {
              setImagemUrl(url);
              setError(null);
            }}
            hint="Aparece na agenda, no detalhe e no card da tela inicial."
          />

          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: destaqueHome }}
            accessibilityLabel="Destacar na tela inicial"
            onPress={() => setDestaqueHome((v) => !v)}
            style={({ pressed }) => pressed && { opacity: 0.7 }}
            className={[
              'flex-row items-start gap-md rounded-lg border p-lg',
              destaqueHome
                ? 'border-gold bg-gold-fixed'
                : 'border-outline-variant bg-surface-bright',
            ].join(' ')}
          >
            <MaterialCommunityIcons
              name={destaqueHome ? 'star' : 'star-outline'}
              size={22}
              color={destaqueHome ? colors.onGoldFixed : colors.inkMuted}
            />
            <View className="flex-1">
              <Text
                className={[
                  'font-sans-semibold text-[15px]',
                  destaqueHome ? 'text-on-gold-fixed' : 'text-ink',
                ].join(' ')}
              >
                Destacar na tela inicial
              </Text>
              <Text
                className={[
                  'mt-0.5 font-sans text-[13px] leading-5',
                  destaqueHome ? 'text-on-gold-fixed' : 'text-ink-muted',
                ].join(' ')}
              >
                Aparece no card principal da Home, com contagem regressiva. Só um evento
                pode estar em destaque — marcar este tira o destaque do anterior.
              </Text>
            </View>
          </Pressable>
        </Secao>

        {/* ═══ Salvar ═══════════════════════════════════════════════ */}
        <View className="gap-md">
          {error ? (
            <View className="flex-row items-start gap-sm rounded-md bg-surface-dim px-lg py-md">
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={17}
                color={colors.error}
                style={{ marginTop: 1 }}
              />
              <Text className="flex-1 font-sans text-[13px] leading-5 text-error">
                {error}
              </Text>
            </View>
          ) : faltando ? (
            <View className="flex-row items-center gap-sm">
              <MaterialCommunityIcons
                name="information-outline"
                size={16}
                color={colors.inkMuted}
              />
              <Text className="flex-1 font-sans text-[13px] text-ink-muted">{faltando}</Text>
            </View>
          ) : null}

          <Button
            label={isEditing ? 'Salvar alterações' : 'Criar evento'}
            loading={isLoading}
            disabled={faltando !== null}
            icon={
              <MaterialCommunityIcons
                name="calendar-check-outline"
                size={18}
                color={colors.onPrimary}
              />
            }
            onPress={handleSubmit}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ────────────────────────────────────────────────────────────────────── */

/**
 * Bloco nomeado do formulário.
 *
 * O número não é enfeite: nove campos seguidos não têm começo nem fim
 * aparente, e a pessoa não sabe quanto falta. Três blocos numerados dizem o
 * tamanho da tarefa antes de ela começar.
 */
function Secao({
  titulo,
  numero,
  opcional = false,
  children,
}: {
  titulo: string;
  numero: number;
  opcional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-lg">
      <View className="flex-row items-center gap-md">
        <View className="h-6 w-6 items-center justify-center rounded-full bg-surface-dim">
          <Text className="font-sans-semibold text-[12px] text-ink-muted">{numero}</Text>
        </View>
        <Text
          className="font-serif-bold text-lg text-ink"
          style={{ letterSpacing: tracking.heading }}
        >
          {titulo}
        </Text>
        {opcional ? (
          <Text
            className="font-sans text-[11px] uppercase text-ink-muted"
            style={{ letterSpacing: tracking.overline }}
          >
            Opcional
          </Text>
        ) : null}
      </View>
      <View className="gap-lg">{children}</View>
    </View>
  );
}

/** Campo com rótulo próprio, para os que não são `TextField`. */
function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <View className="gap-sm">
      <Text
        className="font-sans-semibold text-[11px] uppercase text-ink-muted"
        style={{ letterSpacing: tracking.overline }}
      >
        {rotulo}
      </Text>
      {children}
    </View>
  );
}

/**
 * Opção de escolha única.
 *
 * Altura de 40 e não os 28 anteriores: eram pílulas de `py-1.5` com texto de
 * 12px, o que dava ~27px de alvo — abaixo do mínimo, e apertado para dedo de
 * quem não tem mão firme.
 */
function Opcao({
  label,
  ativo,
  onPress,
}: {
  label: string;
  ativo: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: ativo }}
      onPress={onPress}
      style={({ pressed }) => [{ minHeight: 40 }, pressed && { opacity: 0.7 }]}
      className={[
        'items-center justify-center rounded-md border px-lg',
        ativo ? 'border-primary bg-primary' : 'border-outline-variant bg-surface-bright',
      ].join(' ')}
    >
      <Text
        className={[
          'font-sans-medium text-[14px]',
          ativo ? 'text-on-primary' : 'text-ink',
        ].join(' ')}
      >
        {label}
      </Text>
    </Pressable>
  );
}
