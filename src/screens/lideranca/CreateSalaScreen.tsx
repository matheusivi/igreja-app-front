import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, TextField } from '../../components';
import { useCriarSala } from '../../hooks/queries/useCursos';
import { useThemeColors } from '../../hooks/useThemeColors';
import type { AppStackParamList } from '../../navigation/types';
import { extractErrorMessage } from '../../services/api';
import type { CreateSalaPayload, PublicoSala } from '../../services/courses.service';
import { isValidDate, maskDate } from '../../utils/masks';

type Props = NativeStackScreenProps<AppStackParamList, 'CreateSala'>;

/**
 * "10/03/2026" -> "2026-03-10T00:00:00.000Z"
 *
 * A string é montada na mão, sem passar por `new Date(...)`, por dois motivos:
 *
 * 1. O Hermes (motor JS do React Native) não interpreta strings de data
 *    exatamente como o Node. Depender disso é apostar que os dois concordam.
 * 2. Início e término de turma são datas, não instantes. Converter a
 *    meia-noite local para UTC empurraria a data para o dia anterior em
 *    qualquer fuso a oeste de Greenwich — uma turma marcada para 01/08
 *    chegaria ao banco como 31/07.
 */
function displayDateToISO(display: string): string | null {
  if (!isValidDate(display)) return null;
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(display.trim());
  if (!match) return null;
  const [, d, m, y] = match;
  return `${y}-${m}-${d}T00:00:00.000Z`;
}

export function CreateSalaScreen({ route, navigation }: Props) {
  const colors = useThemeColors();
  const { cursoId, cursoTitulo } = route.params;
  const criarSala = useCriarSala();

  const [nomeSala, setNomeSala] = useState('');
  const [capacidade, setCapacidade] = useState('');
  // "Todos" por padrão; o servidor ajusta sozinho quando o curso já é de um
  // sexo só, então o líder não precisa repetir a informação.
  const [publico, setPublico] = useState<PublicoSala>('Todos');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [error, setError] = useState<string | null>(null);

  function canSubmit(): boolean {
    return nomeSala.trim().length >= 3;
  }

  function handleSubmit() {
    setError(null);

    // O backend exige no mínimo 3 caracteres. Antes esta tela nem enviava o
    // nome — mandava só `capacidade`, um campo que o backend não conhecia —
    // e por isso toda criação de turma voltava 400.
    if (nomeSala.trim().length < 3) {
      setError('O nome da turma deve ter pelo menos 3 caracteres.');
      return;
    }

    let cap: number | null = null;
    if (capacidade.trim()) {
      const n = parseInt(capacidade.trim(), 10);
      if (isNaN(n) || n < 1) {
        setError('A capacidade deve ser um número maior que zero.');
        return;
      }
      cap = n;
    }

    let inicioISO: string | undefined;
    if (dataInicio.trim()) {
      const iso = displayDateToISO(dataInicio);
      if (!iso) {
        setError('Data de início inválida. Use DD/MM/AAAA.');
        return;
      }
      inicioISO = iso;
    }

    let fimISO: string | undefined;
    if (dataFim.trim()) {
      const iso = displayDateToISO(dataFim);
      if (!iso) {
        setError('Data de término inválida. Use DD/MM/AAAA.');
        return;
      }
      fimISO = iso;
    }

    // Comparação de strings basta: no formato ISO, ordem alfabética é ordem
    // cronológica. Evita mais uma passagem por `new Date`.
    if (inicioISO && fimISO && inicioISO > fimISO) {
      setError('A data de término não pode ser anterior à de início.');
      return;
    }

    const payload: CreateSalaPayload = {
      nomeSala: nomeSala.trim(),
      capacidade: cap,
      publico,
      ...(inicioISO ? { dataInicio: inicioISO } : {}),
      ...(fimISO ? { dataFim: fimISO } : {}),
    };

    criarSala.mutate(
      { cursoId, payload },
      {
        onSuccess: () => navigation.goBack(),
        onError: (e) =>
          setError(extractErrorMessage(e, 'Não foi possível criar a turma.')),
      },
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <View className="flex-row items-center justify-between border-b border-outline-variant px-gutter py-3">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </Pressable>
        <Text className="font-serif-bold text-base text-primary">Nova Turma</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        className="flex-1 px-gutter"
        contentContainerClassName="gap-4 py-3xl"
        keyboardShouldPersistTaps="handled"
      >
        <Card contentClassName="gap-2">
          <Text className="font-sans-semibold text-xs uppercase tracking-wide text-ink-muted">
            Curso
          </Text>
          <Text className="font-serif-bold text-lg text-ink">{cursoTitulo}</Text>
          <Text className="font-sans text-xs text-ink-muted">
            Você será o líder desta turma
          </Text>
        </Card>

        <TextField
          label="Nome da turma *"
          placeholder="Ex: Turma da manhã · Domingos 9h"
          value={nomeSala}
          onChangeText={(v) => { setNomeSala(v); setError(null); }}
          maxLength={100}
        />
        <Text className="font-sans text-xs text-ink-muted" style={{ marginTop: -12 }}>
          É o que diferencia esta turma das outras do mesmo curso.
        </Text>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <TextField
              label="Início (opcional)"
              placeholder="DD/MM/AAAA"
              value={dataInicio}
              onChangeText={(v) => { setDataInicio(maskDate(v)); setError(null); }}
              keyboardType="numeric"
              maxLength={10}
            />
          </View>
          <View className="flex-1">
            <TextField
              label="Término (opcional)"
              placeholder="DD/MM/AAAA"
              value={dataFim}
              onChangeText={(v) => { setDataFim(maskDate(v)); setError(null); }}
              keyboardType="numeric"
              maxLength={10}
            />
          </View>
        </View>

        <View className="gap-2">
          <Text className="font-sans-semibold text-xs uppercase tracking-wide text-ink-muted">
            Quem pode participar
          </Text>
          <View className="flex-row gap-2">
            {(['Todos', 'Homens', 'Mulheres'] as const).map((p) => (
              <Pressable
                key={p}
                onPress={() => setPublico(p)}
                className={[
                  'flex-1 items-center rounded-lg border py-2.5',
                  publico === p
                    ? 'border-primary bg-primary'
                    : 'border-outline-variant bg-surface-container-low',
                ].join(' ')}
              >
                <Text
                  className={[
                    'font-sans-medium text-sm',
                    publico === p ? 'text-on-primary' : 'text-ink',
                  ].join(' ')}
                >
                  {p}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text className="font-sans text-xs leading-4 text-ink-muted">
            Num curso geral dá para ter uma turma só de homens e outra só de
            mulheres. Quem não se encaixa não vê a turma.
          </Text>
        </View>

        <TextField
          label="Capacidade máxima (opcional)"
          placeholder="Ex: 20"
          value={capacidade}
          onChangeText={(v) => { setCapacidade(v); setError(null); }}
          keyboardType="numeric"
          maxLength={4}
        />
        <Text className="font-sans text-xs text-ink-muted" style={{ marginTop: -12 }}>
          Deixe em branco para não limitar as vagas.
        </Text>

        {error ? (
          <Text className="font-sans text-xs text-error">{error}</Text>
        ) : null}

        <Button
          label="Criar turma"
          loading={criarSala.isPending}
          disabled={!canSubmit()}
          icon={<Ionicons name="school-outline" size={16} color={colors.onGold} />}
          onPress={handleSubmit}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
