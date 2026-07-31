import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { Button, EmentaEditor, TextField } from '../../components';
import { cursosKeys } from '../../hooks/queries/useCursos';
import { useThemeColors } from '../../hooks/useThemeColors';
import type { AppStackParamList } from '../../navigation/types';
import { extractErrorMessage } from '../../services/api';
import {
  capitulosParaItens,
  coursesService,
  itensParaCapitulos,
  type Curso,
  type ItemEmenta,
} from '../../services/courses.service';

type Props = NativeStackScreenProps<AppStackParamList, 'EditCurso'>;

const CATEGORIAS: Curso['categoria'][] = ['Homens', 'Mulheres', 'Casais', 'Jovens', 'Geral', 'Batismo'];

export function EditCursoScreen({ route, navigation }: Props) {
  const colors = useThemeColors();
  const queryClient = useQueryClient();
  const [nome, setNome] = useState('');
  const [descricaoMaterial, setDescricaoMaterial] = useState('');
  const [categoria, setCategoria] = useState<Curso['categoria']>('Geral');
  const [duracao, setDuracao] = useState('');
  const [publicoAlvo, setPublicoAlvo] = useState('');
  const [itensEmenta, setItensEmenta] = useState<ItemEmenta[]>([]);
  const [isLoadingCurso, setIsLoadingCurso] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setIsLoadingCurso(true);
      try {
        const curso = await coursesService.getCurso(route.params.id);
        setNome(curso.nome);
        setDescricaoMaterial(curso.descricaoMaterial ?? '');
        setCategoria(curso.categoria);
        setDuracao(curso.duracao ?? '');
        setPublicoAlvo(curso.publicoAlvo ?? '');
        setItensEmenta(capitulosParaItens(curso.capitulos ?? []));
      } catch (e) {
        setError(extractErrorMessage(e, 'Não foi possível carregar o curso.'));
      } finally {
        setIsLoadingCurso(false);
      }
    }
    load();
  }, [route.params.id]);

  function canSubmit(): boolean {
    return nome.trim().length > 0;
  }

  async function handleSubmit() {
    setError(null);
    setIsLoading(true);
    try {
      await coursesService.updateCurso(Number(route.params.id), {
        nome: nome.trim(),
        descricaoMaterial: descricaoMaterial.trim(),
        categoria,
        duracao: duracao.trim() || null,
        publicoAlvo: publicoAlvo.trim() || null,
        // Enviado sempre: é o que permite apagar uma aula. Omitir o campo
        // faria o backend entender "não mexer na ementa".
        capitulos: itensParaCapitulos(itensEmenta),
      });

      // A tela de detalhe lê do cache. Sem invalidar, a pessoa salvaria a
      // ementa e voltaria para a versão antiga — parecendo que não gravou.
      await queryClient.invalidateQueries({
        queryKey: cursosKeys.all,
        refetchType: 'all',
      });

      navigation.goBack();
    } catch (e) {
      setError(extractErrorMessage(e, 'Não foi possível salvar as alterações.'));
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoadingCurso) {
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
        <Text className="font-serif-bold text-base text-primary">Editar Curso</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        className="flex-1 px-gutter"
        contentContainerClassName="gap-4 py-lg"
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
          label="Salvar alterações"
          loading={isLoading}
          disabled={!canSubmit()}
          onPress={handleSubmit}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
