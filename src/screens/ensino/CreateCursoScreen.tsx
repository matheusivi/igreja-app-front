import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { Button, EmentaEditor, TextField } from '../../components';
import { cursosKeys } from '../../hooks/queries/useCursos';
import { useThemeColors } from '../../hooks/useThemeColors';
import type { AppStackParamList } from '../../navigation/types';
import { extractErrorMessage } from '../../services/api';
import {
  coursesService,
  itensParaCapitulos,
  type Curso,
  type ItemEmenta,
} from '../../services/courses.service';

type Props = NativeStackScreenProps<AppStackParamList, 'CreateCurso'>;

const CATEGORIAS: Curso['categoria'][] = ['Homens', 'Mulheres', 'Casais', 'Jovens', 'Geral', 'Batismo'];

export function CreateCursoScreen({ navigation }: Props) {
  const colors = useThemeColors();
  const queryClient = useQueryClient();
  const [nome, setNome] = useState('');
  const [descricaoMaterial, setDescricaoMaterial] = useState('');
  const [categoria, setCategoria] = useState<Curso['categoria']>('Geral');
  const [duracao, setDuracao] = useState('');
  const [publicoAlvo, setPublicoAlvo] = useState('');
  const [itensEmenta, setItensEmenta] = useState<ItemEmenta[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function canSubmit(): boolean {
    return nome.trim().length > 0;
  }

  async function handleSubmit() {
    setError(null);
    setIsLoading(true);
    try {
      const curso = await coursesService.createCurso({
        nome: nome.trim(),
        descricaoMaterial: descricaoMaterial.trim(),
        categoria,
        duracao: duracao.trim() || null,
        publicoAlvo: publicoAlvo.trim() || null,
        capitulos: itensParaCapitulos(itensEmenta),
      });

      // Só as listas: o curso é novo, então não existe detalhe nem turmas em
      // cache para recarregar.
      await queryClient.invalidateQueries({
        queryKey: cursosKeys.listas(),
        refetchType: 'all',
      });

      navigation.replace('CursoDetail', { id: String(curso.id) });
    } catch (e) {
      setError(extractErrorMessage(e, 'Não foi possível criar o curso.'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center justify-between border-b border-outline-variant px-gutter py-3">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </Pressable>
        <Text className="font-serif-bold text-base text-primary">Criar Curso</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        className="flex-1 px-gutter"
        contentContainerClassName="gap-4 py-3xl"
        keyboardShouldPersistTaps="handled"
      >
        <TextField
          label="Nome do curso *"
          placeholder="Ex: Fundamentos da Fé"
          value={nome}
          onChangeText={(v) => { setNome(v); setError(null); }}
        />

        <TextField
          label="Descrição"
          placeholder="Sobre o material do curso..."
          value={descricaoMaterial}
          onChangeText={setDescricaoMaterial}
          multiline
          numberOfLines={4}
        />

        <View className="gap-2">
          <Text className="font-sans-semibold text-xs uppercase tracking-wide text-ink-muted">
            Categoria
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {CATEGORIAS.map((c) => (
              <Pressable
                key={c}
                onPress={() => setCategoria(c)}
                className={[
                  'rounded-full border px-3 py-1.5',
                  categoria === c
                    ? 'border-primary bg-primary'
                    : 'border-outline-variant bg-surface-container-low',
                ].join(' ')}
              >
                <Text
                  className={[
                    'font-sans-medium text-xs',
                    categoria === c ? 'text-on-primary' : 'text-ink',
                  ].join(' ')}
                >
                  {c}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <TextField
              label="Duração"
              placeholder="Ex: 13 semanas"
              value={duracao}
              onChangeText={setDuracao}
            />
          </View>
          <View className="flex-1">
            <TextField
              label="Público-alvo"
              placeholder="Ex: Homens a partir de 18 anos"
              value={publicoAlvo}
              onChangeText={setPublicoAlvo}
            />
          </View>
        </View>

        <EmentaEditor itens={itensEmenta} onChange={setItensEmenta} />

        {error ? <Text className="font-sans text-xs text-error">{error}</Text> : null}

        <Button
          label="Criar curso"
          loading={isLoading}
          disabled={!canSubmit()}
          onPress={handleSubmit}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
