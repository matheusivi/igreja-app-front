import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, ImagePickerField, TextField } from '../../components';
import { useThemeColors } from '../../hooks/useThemeColors';
import type { AppStackParamList } from '../../navigation/types';
import { extractErrorMessage } from '../../services/api';
import { eventsService, type CreateEventoPayload, type EventoItem } from '../../services/events.service';
import { useCreateEvento, useUpdateEvento } from '../../hooks/queries/useEventos';
import { isValidDate, isValidTime, maskDate, maskTime } from '../../utils/masks';

type Props = NativeStackScreenProps<AppStackParamList, 'CreateEvento'>;

const TIPOS: EventoItem['tipo'][] = ['Culto', 'Reunião', 'Retiro', 'Conferência', 'Outro'];
const RECORRENCIAS: CreateEventoPayload['recorrencia'][] = ['nenhuma', 'semanal', 'mensal'];
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const PRESET_COLORS = [
  { label: 'Dourado', value: '#F59E0B' },
  { label: 'Azul', value: '#1E40AF' },
  { label: 'Verde', value: '#006C49' },
  { label: 'Vermelho', value: '#BA1A1A' },
  { label: 'Roxo', value: '#7C3AED' },
];

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
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function isoToTimeStr(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${min}`;
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
  const [recorrencia, setRecorrencia] = useState<CreateEventoPayload['recorrencia']>('nenhuma');
  const [diaSemana, setDiaSemana] = useState<number>(0);
  const [diaDoMes, setDiaDoMes] = useState('');
  const [cor, setCor] = useState('');
  const [destaqueHome, setDestaqueHome] = useState(false);
  const [imagemUrl, setImagemUrl] = useState<string | null>(null);
  const [isLoadingEvento, setIsLoadingEvento] = useState(isEditing);
  const [error, setError] = useState<string | null>(null);

  // As mutations cuidam de invalidar o cache: ao salvar, a lista de eventos e
  // o card da Home se atualizam sozinhos, sem ninguém pedir.
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
        setRecorrencia(evento.recorrencia);
        setDiaSemana(evento.diaSemana ?? 0);
        setDiaDoMes(evento.diaDoMes ? String(evento.diaDoMes) : '');
        setCor(evento.cor ?? '');
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

  function canSubmit(): boolean {
    return missingHint() === null;
  }

  /**
   * Diz o que falta para poder salvar. Antes o botão só ficava transparente,
   * sem dizer o motivo — quem digitava a data sem barras ficava travado sem
   * entender.
   */
  function missingHint(): string | null {
    if (!titulo.trim()) return 'Informe o título do evento.';
    if (!dataStr.trim()) return 'Informe a data do evento.';
    if (!isValidDate(dataStr)) return 'Data inválida. Use o formato DD/MM/AAAA.';
    if (!horaStr.trim()) return 'Informe o horário do evento.';
    if (!isValidTime(horaStr)) return 'Horário inválido. Use o formato HH:MM (ex: 19:30).';
    if (recorrencia === 'mensal' && !diaDoMes.trim())
      return 'Informe o dia do mês para a recorrência mensal.';
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
      // Sempre enviado na edição: é o que permite REMOVER a capa. Na criação,
      // `null` é equivalente a não mandar nada.
      imagemUrl,
      ...(local.trim() ? { local: local.trim() } : {}),
      ...(descricao.trim() ? { descricao: descricao.trim() } : {}),
      ...(cor ? { cor } : {}),
      ...(recorrencia === 'semanal' ? { diaSemana } : {}),
      ...(recorrencia === 'mensal' && diaDoMes.trim()
        ? { diaDoMes: parseInt(diaDoMes.trim(), 10) }
        : {}),
    };

    const onError = (e: unknown) =>
      setError(
        extractErrorMessage(
          e,
          isEditing ? 'Não foi possível salvar as alterações.' : 'Não foi possível criar o evento.',
        ),
      );

    if (isEditing) {
      updateEvento.mutate(
        { id: Number(editId), payload },
        { onSuccess: () => navigation.goBack(), onError },
      );
    } else {
      createEvento.mutate(payload, {
        onSuccess: () => navigation.goBack(),
        onError,
      });
    }
  }

  if (isLoadingEvento) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={colors.gold} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center justify-between border-b border-outline-variant px-gutter py-3">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </Pressable>
        <Text className="font-serif-bold text-base text-primary">
          {isEditing ? 'Editar Evento' : 'Novo Evento'}
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        className="flex-1 px-gutter"
        contentContainerClassName="gap-4 py-lg"
        keyboardShouldPersistTaps="handled"
      >
        {/* Título */}
        <TextField
          label="Título *"
          placeholder="Nome do evento"
          value={titulo}
          onChangeText={(v) => { setTitulo(v); setError(null); }}
        />

        {/* Tipo */}
        <View className="gap-2">
          <Text className="font-sans-semibold text-xs uppercase tracking-wide text-ink-muted">
            Tipo
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {TIPOS.map((t) => (
              <Pressable
                key={t}
                onPress={() => setTipo(t)}
                className={[
                  'rounded-full border px-3 py-1.5',
                  tipo === t
                    ? 'border-primary bg-primary'
                    : 'border-outline-variant bg-surface-container-low',
                ].join(' ')}
              >
                <Text
                  className={[
                    'font-sans-medium text-xs',
                    tipo === t ? 'text-on-primary' : 'text-ink',
                  ].join(' ')}
                >
                  {t}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Data e hora */}
        <View className="flex-row gap-3">
          <View className="flex-1">
            <TextField
              label="Data *"
              placeholder="DD/MM/AAAA"
              value={dataStr}
              onChangeText={(v) => { setDataStr(maskDate(v)); setError(null); }}
              keyboardType="numeric"
              maxLength={10}
            />
          </View>
          <View className="flex-1">
            <TextField
              label="Hora *"
              placeholder="HH:MM"
              value={horaStr}
              onChangeText={(v) => { setHoraStr(maskTime(v)); setError(null); }}
              keyboardType="numeric"
              maxLength={5}
            />
          </View>
        </View>

        {/* Local */}
        <TextField
          label="Local"
          placeholder="Ex: Templo principal"
          value={local}
          onChangeText={setLocal}
        />

        {/* Descrição */}
        <TextField
          label="Descrição"
          placeholder="Detalhes sobre o evento..."
          value={descricao}
          onChangeText={setDescricao}
          multiline
          numberOfLines={4}
        />

        {/* Recorrência */}
        <View className="gap-2">
          <Text className="font-sans-semibold text-xs uppercase tracking-wide text-ink-muted">
            Recorrência
          </Text>
          <View className="flex-row gap-2">
            {RECORRENCIAS.map((r) => {
              const label = r === 'nenhuma' ? 'Nenhuma' : r === 'semanal' ? 'Semanal' : 'Mensal';
              return (
                <Pressable
                  key={r}
                  onPress={() => setRecorrencia(r)}
                  className={[
                    'rounded-full border px-3 py-1.5',
                    recorrencia === r
                      ? 'border-secondary bg-secondary'
                      : 'border-outline-variant bg-surface-container-low',
                  ].join(' ')}
                >
                  <Text
                    className={[
                      'font-sans-medium text-xs',
                      recorrencia === r ? 'text-on-secondary' : 'text-ink',
                    ].join(' ')}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Dia da semana — se semanal */}
        {recorrencia === 'semanal' ? (
          <View className="gap-2">
            <Text className="font-sans-semibold text-xs uppercase tracking-wide text-ink-muted">
              Dia da semana
            </Text>
            <View className="flex-row gap-1.5">
              {DIAS_SEMANA.map((d, idx) => (
                <Pressable
                  key={d}
                  onPress={() => setDiaSemana(idx)}
                  className={[
                    'flex-1 items-center rounded-lg border py-2',
                    diaSemana === idx
                      ? 'border-gold bg-gold'
                      : 'border-outline-variant bg-surface-container-low',
                  ].join(' ')}
                >
                  <Text
                    className={[
                      'font-sans-medium text-xs',
                      diaSemana === idx ? 'text-on-gold' : 'text-ink',
                    ].join(' ')}
                  >
                    {d}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {/* Dia do mês — se mensal */}
        {recorrencia === 'mensal' ? (
          <TextField
            label="Dia do mês *"
            placeholder="Ex: 15"
            value={diaDoMes}
            onChangeText={(v) => { setDiaDoMes(v); setError(null); }}
            keyboardType="numeric"
            maxLength={2}
          />
        ) : null}

        {/* Cor */}
        <View className="gap-2">
          <Text className="font-sans-semibold text-xs uppercase tracking-wide text-ink-muted">
            Cor do evento
          </Text>
          <View className="flex-row items-center gap-3">
            {PRESET_COLORS.map((preset) => (
              <Pressable
                key={preset.value}
                onPress={() => setCor(cor === preset.value ? '' : preset.value)}
                className="h-8 w-8 items-center justify-center rounded-full"
                style={{ backgroundColor: preset.value }}
              >
                {cor === preset.value ? (
                  <Ionicons name="checkmark" size={14} color="white" />
                ) : null}
              </Pressable>
            ))}
            <Pressable
              onPress={() => setCor('')}
              className={[
                'h-8 w-8 items-center justify-center rounded-full border',
                !cor ? 'border-primary bg-surface-container-low' : 'border-outline-variant',
              ].join(' ')}
            >
              {!cor ? <Ionicons name="checkmark" size={14} color={colors.primary} /> : null}
            </Pressable>
          </View>
          {cor ? (
            <Text className="font-sans text-xs text-ink-muted">
              Cor selecionada: <Text className="font-sans-semibold">{cor}</Text>
            </Text>
          ) : (
            <Text className="font-sans text-xs text-ink-muted">Sem cor (padrão)</Text>
          )}
        </View>

        <ImagePickerField
          label="Capa do evento"
          pasta="eventos"
          value={imagemUrl}
          onChange={(url) => { setImagemUrl(url); setError(null); }}
          hint="Opcional. Aparece na agenda, no detalhe e no card da tela inicial."
        />

        {/* Destaque na Home */}
        <Pressable
          onPress={() => setDestaqueHome((v) => !v)}
          className="flex-row items-center gap-3 rounded-lg border border-outline-variant bg-surface-container-low p-3"
        >
          <Ionicons
            name={destaqueHome ? 'star' : 'star-outline'}
            size={20}
            color={destaqueHome ? colors.gold : colors.outline}
          />
          <View className="flex-1">
            <Text className="font-sans-semibold text-sm text-ink">Destacar na tela inicial</Text>
            <Text className="font-sans text-xs leading-4 text-ink-muted">
              Este evento aparece no card principal da Home, com contagem regressiva. Sem nenhum
              destaque marcado, a Home mostra o próximo evento da agenda.
            </Text>
          </View>
        </Pressable>

        {error ? (
          <Text className="font-sans text-xs text-error">{error}</Text>
        ) : missingHint() ? (
          <View className="flex-row items-center gap-2">
            <Ionicons name="information-circle-outline" size={14} color={colors.outline} />
            <Text className="flex-1 font-sans text-xs text-ink-muted">{missingHint()}</Text>
          </View>
        ) : null}

        <Button
          label={isEditing ? 'Salvar alterações' : 'Criar evento'}
          loading={isLoading}
          disabled={!canSubmit()}
          icon={<Ionicons name="calendar-outline" size={16} color={colors.onGold} />}
          onPress={handleSubmit}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
