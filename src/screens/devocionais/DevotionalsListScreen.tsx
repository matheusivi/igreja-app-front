import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Chip, SectionHeader } from '../../components';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuth } from '../../navigation/AuthContext';
import type { AppStackParamList } from '../../navigation/types';
import { contentService, makeExcerpt, type Conteudo } from '../../services/content.service';
import { extractErrorMessage } from '../../services/api';

type FilterKey = 'todos' | 'Devocional' | 'Estudo';

const filters: { key: FilterKey; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'Devocional', label: 'Devocionais' },
  { key: 'Estudo', label: 'Estudos teológicos' },
];

function tipoLabel(tipo: Conteudo['tipo']): string {
  if (tipo === 'Devocional') return 'Devocional';
  if (tipo === 'Estudo') return 'Teologia';
  return tipo;
}

export function DevotionalsListScreen() {
  const colors = useThemeColors();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { user } = useAuth();
  const isLeader = ['Líder', 'Pastor', 'Administrador'].includes(user?.perfil ?? '');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('todos');
  const [conteudos, setConteudos] = useState<Conteudo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const [devocionais, estudos] = await Promise.all([
          contentService.list({ tipo: 'Devocional', limit: 20, orderBy: 'recent' }),
          contentService.list({ tipo: 'Estudo', limit: 20, orderBy: 'recent' }),
        ]);
        setConteudos([...devocionais, ...estudos]);
      } catch (e) {
        setError(extractErrorMessage(e));
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  function confirmDelete(id: number) {
    Alert.alert(
      'Excluir conteúdo',
      'Tem certeza que deseja excluir este conteúdo? Essa ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await contentService.remove(id);
              setConteudos((current) => current.filter((c) => c.id !== id));
            } catch (e) {
              Alert.alert('Erro', extractErrorMessage(e, 'Não foi possível excluir.'));
            }
          },
        },
      ],
    );
  }

  function canManage(conteudo: Conteudo): boolean {
    return (
      conteudo.autor.id === user?.id ||
      ['Pastor', 'Administrador'].includes(user?.perfil ?? '')
    );
  }

  const filtered = useMemo(() => {
    if (activeFilter === 'todos') return conteudos;
    return conteudos.filter((c) => c.tipo === activeFilter);
  }, [conteudos, activeFilter]);

  const featured = filtered.find((c) => c.principal);
  const rest = filtered.filter((c) => !c.principal);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center justify-between border-b border-outline-variant px-gutter py-3">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </Pressable>
        <Text className="font-serif-bold text-base text-primary">Devocionais</Text>
        {isLeader ? (
          <Pressable
            onPress={() => navigation.navigate('CreateConteudo', { tipo: 'Devocional' })}
            hitSlop={8}
          >
            <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
          </Pressable>
        ) : (
          <View style={{ width: 22 }} />
        )}
      </View>

      <ScrollView className="flex-1 px-gutter" contentContainerClassName="gap-md py-lg">
        <SectionHeader
          title="Devocionais"
          subtitle="Reflexões diárias e estudos aprofundados preparados por nossos pastores para fortalecer sua caminhada com Cristo."
        />

        <View className="flex-row gap-2">
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
            <Pressable onPress={() => {}} hitSlop={8}>
              <Text className="font-sans-semibold text-sm text-secondary">Tentar novamente</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {featured ? (
              <Pressable
                onPress={() =>
                  navigation.navigate('DevocionalDetail', { id: String(featured.id) })
                }
              >
                <Card accent contentClassName="gap-2">
                  {featured.imagemUrl ? (
                    <Image
                      source={{ uri: featured.imagemUrl }}
                      className="w-full rounded-lg"
                      style={{ aspectRatio: 16 / 9 }}
                      resizeMode="cover"
                    />
                  ) : null}
                  <View className="flex-row items-start justify-between">
                    <Chip label="Destaque" tone="success" active />
                    {canManage(featured) ? (
                      <View className="flex-row gap-3">
                        <Pressable
                          onPress={() =>
                            navigation.navigate('CreateConteudo', { id: String(featured.id) })
                          }
                          hitSlop={8}
                        >
                          <Ionicons name="pencil-outline" size={16} color={colors.secondary} />
                        </Pressable>
                        <Pressable onPress={() => confirmDelete(featured.id)} hitSlop={8}>
                          <Ionicons name="trash-outline" size={16} color={colors.error} />
                        </Pressable>
                      </View>
                    ) : null}
                  </View>
                  <Text className="font-sans-semibold text-xs uppercase tracking-wide text-secondary">
                    {tipoLabel(featured.tipo)}
                  </Text>
                  <Text className="font-serif-bold text-xl text-ink">{featured.titulo}</Text>
                  <Text className="font-sans text-sm leading-5 text-ink-muted">
                    {makeExcerpt(featured.texto)}
                  </Text>
                  <Text className="font-sans-medium text-xs text-outline">
                    {featured.autor.nomeCompleto}
                  </Text>
                </Card>
              </Pressable>
            ) : null}

            <View className="gap-3">
              {rest.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() =>
                    navigation.navigate('DevocionalDetail', { id: String(item.id) })
                  }
                >
                  <Card contentClassName="gap-1">
                    {/* Miniatura em vez de capa cheia: mantém a lista
                        compacta e ainda dá identidade visual a cada item. */}
                    {item.imagemUrl ? (
                      <Image
                        source={{ uri: item.imagemUrl }}
                        className="mb-1 w-full rounded-lg"
                        style={{ aspectRatio: 21 / 9 }}
                        resizeMode="cover"
                      />
                    ) : null}
                    <View className="flex-row items-start justify-between">
                      <Text className="font-sans-semibold text-xs uppercase tracking-wide text-secondary">
                        {tipoLabel(item.tipo)}
                      </Text>
                      {canManage(item) ? (
                        <View className="flex-row gap-3">
                          <Pressable
                            onPress={() =>
                              navigation.navigate('CreateConteudo', { id: String(item.id) })
                            }
                            hitSlop={8}
                          >
                            <Ionicons name="pencil-outline" size={14} color={colors.secondary} />
                          </Pressable>
                          <Pressable onPress={() => confirmDelete(item.id)} hitSlop={8}>
                            <Ionicons name="trash-outline" size={14} color={colors.error} />
                          </Pressable>
                        </View>
                      ) : null}
                    </View>
                    <Text className="font-serif-bold text-lg text-ink">{item.titulo}</Text>
                    <Text className="font-sans text-sm leading-5 text-ink-muted">
                      {makeExcerpt(item.texto)}
                    </Text>
                    <Text className="mt-1 font-sans-medium text-xs text-outline">
                      {item.autor.nomeCompleto}
                    </Text>
                  </Card>
                </Pressable>
              ))}

              {filtered.length === 0 && (
                <Text className="text-center font-sans text-sm text-ink-muted py-8">
                  Nenhum conteúdo encontrado.
                </Text>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
