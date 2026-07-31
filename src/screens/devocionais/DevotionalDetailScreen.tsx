import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components';
import { useThemeColors } from '../../hooks/useThemeColors';
import type { AppStackParamList } from '../../navigation/types';
import { contentService, type Conteudo } from '../../services/content.service';
import { extractErrorMessage } from '../../services/api';
import { useAuth } from '../../navigation/AuthContext';

type Props = NativeStackScreenProps<AppStackParamList, 'DevocionalDetail'>;

function parseParagraphs(texto: string | null): string[] {
  if (!texto) return [];
  return texto.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
}

export function DevotionalDetailScreen({ route, navigation }: Props) {
  const colors = useThemeColors();
  const { user } = useAuth();
  const [conteudo, setConteudo] = useState<Conteudo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markedAsRead, setMarkedAsRead] = useState(false);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await contentService.get(route.params.id);
        setConteudo(data);
      } catch (e) {
        setError(extractErrorMessage(e));
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [route.params.id]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center justify-between border-b border-outline-variant px-gutter py-3">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </Pressable>
        <Text className="font-serif-bold text-base text-primary">IBVI Nova Andradina</Text>
        {conteudo &&
        (conteudo.autor.id === user?.id ||
          ['Pastor', 'Administrador'].includes(user?.perfil ?? '')) ? (
          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={() => navigation.navigate('CreateConteudo', { id: String(conteudo.id) })}
              hitSlop={8}
            >
              <Ionicons name="pencil-outline" size={18} color={colors.secondary} />
            </Pressable>
            <Pressable
              onPress={() =>
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
                          await contentService.remove(conteudo.id);
                          navigation.goBack();
                        } catch (e) {
                          Alert.alert('Erro', extractErrorMessage(e, 'Não foi possível excluir.'));
                        }
                      },
                    },
                  ],
                )
              }
              hitSlop={8}
            >
              <Ionicons name="trash-outline" size={18} color={colors.error} />
            </Pressable>
          </View>
        ) : (
          <Ionicons name="bookmark-outline" size={20} color={colors.primary} />
        )}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.gold} />
        </View>
      ) : error || !conteudo ? (
        <View className="flex-1 items-center justify-center gap-3 px-gutter">
          <Text className="text-center font-sans text-sm text-ink-muted">
            {error ?? 'Conteúdo não encontrado.'}
          </Text>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Text className="font-sans-semibold text-sm text-secondary">Voltar</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerClassName="gap-md px-gutter py-lg">
          {conteudo.imagemUrl ? (
            <Image
              source={{ uri: conteudo.imagemUrl }}
              className="w-full rounded-xl"
              style={{ aspectRatio: 16 / 9 }}
              resizeMode="cover"
            />
          ) : null}

          <Text className="font-sans-semibold text-xs uppercase tracking-wide text-secondary">
            {conteudo.tipo}
          </Text>
          <Text className="font-serif-bold text-2xl leading-8 text-ink">{conteudo.titulo}</Text>

          <View className="flex-row items-center gap-2">
            <View className="h-9 w-9 items-center justify-center rounded-full bg-surface-container-high">
              <Ionicons name="person" size={16} color={colors.primary} />
            </View>
            <View>
              <Text className="font-sans-semibold text-sm text-ink">
                {conteudo.autor.nomeCompleto}
              </Text>
            </View>
            <Text className="ml-auto font-sans text-xs text-outline">
              {new Date(conteudo.dataPublicacao).toLocaleDateString('pt-BR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          </View>

          {parseParagraphs(conteudo.texto).map((paragraph, index) => (
            <Text key={index} className="font-sans text-base leading-7 text-ink">
              {paragraph}
            </Text>
          ))}

          <Button
            label={markedAsRead ? 'Marcado como lido' : 'Marcar como lido'}
            icon={
              <Ionicons
                name={markedAsRead ? 'checkmark-circle' : 'checkmark-circle-outline'}
                size={18}
                color={colors.onGold}
              />
            }
            onPress={() => setMarkedAsRead(true)}
          />

          <View className="flex-row justify-center gap-6">
            <View className="flex-row items-center gap-1">
              <Ionicons name="share-social-outline" size={16} color={colors.secondary} />
              <Text className="font-sans-semibold text-sm text-secondary">Compartilhar</Text>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
