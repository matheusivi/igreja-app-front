import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Chip, SectionHeader, TextField } from '../../components';
import { useCursos } from '../../hooks/queries/useCursos';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuth } from '../../navigation/AuthContext';
import type { AppStackParamList } from '../../navigation/types';
import type { Curso } from '../../services/courses.service';
import { extractErrorMessage } from '../../services/api';

type CategoriaFilter = Curso['categoria'] | 'todos';

const filters: { key: CategoriaFilter; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'Geral', label: 'Geral' },
  { key: 'Homens', label: 'Homens' },
  { key: 'Mulheres', label: 'Mulheres' },
  { key: 'Casais', label: 'Casais' },
  { key: 'Jovens', label: 'Jovens' },
  { key: 'Batismo', label: 'Batismo' },
];

export function CoursesListScreen() {
  const colors = useThemeColors();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { user } = useAuth();
  const isLeader = ['Líder', 'Pastor', 'Administrador'].includes(user?.perfil ?? '');
  const [activeFilter, setActiveFilter] = useState<CategoriaFilter>('todos');
  const [busca, setBusca] = useState('');

  /**
   * Vem do cache compartilhado.
   *
   * Antes esta tela carregava uma vez num `useEffect` e nunca mais. Criar ou
   * excluir um curso em outra tela invalidava o cache, mas aqui não chegava
   * nada — um curso apagado continuava listado até o app ser reiniciado.
   */
  const {
    data: cursos = [],
    isPending: isLoading,
    error: queryError,
    refetch,
  } = useCursos();

  const error = queryError ? extractErrorMessage(queryError) : null;

  const filteredCursos = useMemo(() => {
    let list = activeFilter === 'todos' ? cursos : cursos.filter((c) => c.categoria === activeFilter);
    const termo = busca.trim().toLowerCase();
    if (termo) {
      list = list.filter((c) => c.nome.toLowerCase().includes(termo));
    }
    return list;
  }, [cursos, activeFilter, busca]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView className="flex-1 px-gutter" contentContainerClassName="gap-md py-lg">
        <SectionHeader
          eyebrow="Academia de Fé"
          title="Cursos & Formação"
          subtitle="Crescimento espiritual através do conhecimento bíblico."
          actionLabel={isLeader ? 'Criar curso' : undefined}
          onActionPress={isLeader ? () => navigation.navigate('CreateCurso') : undefined}
        />

        <TextField
          label="Buscar curso"
          placeholder="Ex: Fundamentos da Fé"
          value={busca}
          onChangeText={setBusca}
          autoCapitalize="none"
        />

        <View className="flex-row flex-wrap gap-2">
          {filters.map((filter) => (
            <Chip
              key={filter.key}
              label={filter.label}
              active={activeFilter === filter.key}
              onPress={() => setActiveFilter(filter.key)}
            />
          ))}
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={colors.gold} style={{ marginTop: 32 }} />
        ) : error ? (
          <View className="items-center gap-3 py-8">
            <Text className="text-center font-sans text-sm text-ink-muted">{error}</Text>
            <Pressable onPress={() => refetch()} hitSlop={8}>
              <Text className="font-sans-semibold text-sm text-secondary">
                Tentar novamente
              </Text>
            </Pressable>
          </View>
        ) : filteredCursos.length === 0 ? (
          <Text className="py-8 text-center font-sans text-sm text-ink-muted">
            Nenhum curso encontrado.
          </Text>
        ) : (
          <View className="gap-3">
            {filteredCursos.map((curso) => (
              <Pressable
                key={curso.id}
                onPress={() => navigation.navigate('CursoDetail', { id: String(curso.id) })}
              >
                <Card contentClassName="gap-2">
                  <View className="flex-row items-start justify-between">
                    <Text className="flex-1 font-serif-bold text-lg text-ink">{curso.nome}</Text>
                    <Chip label={curso.categoria} tone="success" active />
                  </View>
                  {curso.descricaoMaterial ? (
                    <Text className="font-sans text-sm leading-5 text-ink-muted">
                      {curso.descricaoMaterial}
                    </Text>
                  ) : null}
                  {/* O nome de quem cadastrou o curso saiu daqui de propósito:
                      o curso é da igreja. Quem tem dono é a turma, e o líder
                      dela aparece no card da turma. */}
                  <View className="mt-1 flex-row items-center justify-between border-t border-outline-variant pt-2">
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="school-outline" size={14} color={colors.outline} />
                      <Text className="font-sans text-xs text-ink-muted">
                        {[
                          curso.capitulos?.length
                            ? `${curso.capitulos.length} aulas`
                            : null,
                          curso.duracao,
                        ]
                          .filter(Boolean)
                          .join(' · ') || curso.categoria}
                      </Text>
                    </View>
                    <Text className="font-sans-semibold text-sm text-secondary">Ver turmas</Text>
                  </View>
                </Card>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
