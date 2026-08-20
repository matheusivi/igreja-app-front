import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ItemDestaque,
  ItemLista,
  ListaVazia,
  ScreenHeader,
  TileCriar,
  TituloGrupo,
} from '../../components';
import { useConteudos, useExcluirConteudo } from '../../hooks/queries/useConteudos';
import { useLeituras } from '../../hooks/queries/useLeituras';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuth } from '../../navigation/AuthContext';
import type { AppStackParamList } from '../../navigation/types';
import { extractErrorMessage } from '../../services/api';
import { minutosDeLeitura, type Conteudo } from '../../services/content.service';

/**
 * O índice dos devocionais.
 *
 * Mesma gramática de Avisos — ver `ItemConteudo.tsx` e o comentário de
 * `AvisosScreen`. Duas telas irmãs precisam ser lidas como irmãs; antes eram
 * o mesmo código copiado com pequenas divergências, o que é o pior dos dois
 * mundos: idênticas de manter, diferentes de olhar.
 *
 * ═══ O QUE É PRÓPRIO DAQUI ═══
 *
 * **Minutos de leitura na linha de estado.** Devocional se lê inteiro; aviso
 * se varre. Saber que são 3 minutos antes de tocar muda a decisão de abrir
 * agora ou depois — e é a informação que a lista tinha condição de dar e não
 * dava. O número sai do `texto` que o servidor já derivou, sem custo.
 *
 * **O tique de lido.** O selo anterior era um comprimido verde com texto
 * branco sobre verde claro: 1,30:1, ilegível — era ele que aparecia lavado.
 * Estado de "já li" tem que RECUAR; virou um tique de 14px na cor de
 * confirmação, e no destaque ele vai sobre a capa, onde não empurra o texto.
 */
export function DevotionalsListScreen() {
  const colors = useThemeColors();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { user } = useAuth();
  const isLeader = ['Líder', 'Pastor', 'Administrador'].includes(user?.perfil ?? '');

  const {
    data: conteudos = [],
    isPending: isLoading,
    error: queryError,
    refetch,
    isFetching,
  } = useConteudos({ tipo: 'Devocional', limit: 20 });

  const excluirConteudo = useExcluirConteudo();
  const lidos = useLeituras();
  const error = queryError ? extractErrorMessage(queryError) : null;

  function canManage(conteudo: Conteudo): boolean {
    return (
      conteudo.autor.id === user?.id ||
      ['Pastor', 'Administrador'].includes(user?.perfil ?? '')
    );
  }

  const { capa, restante, resumo } = useMemo(() => {
    const destaque = conteudos.find((c) => c.principal) ?? conteudos[0] ?? null;
    const naoLidos = conteudos.filter((c) => !lidos.has(c.id)).length;

    // "2 por ler" é o que faz a pessoa voltar; "12 devocionais" é inventário.
    // Quando não sobrou nada, a linha vira reconhecimento em vez de um zero.
    // E quando NADA foi lido, "5 devocionais · 5 por ler" diria duas vezes o
    // mesmo número — nesse caso a contagem simples já basta.
    const partes = [
      `${conteudos.length} ${conteudos.length === 1 ? 'devocional' : 'devocionais'}`,
      naoLidos === 0
        ? 'tudo lido'
        : naoLidos < conteudos.length
          ? `${naoLidos} por ler`
          : null,
    ].filter(Boolean);

    return {
      capa: destaque,
      restante: destaque ? conteudos.filter((c) => c.id !== destaque.id) : [],
      resumo: conteudos.length > 0 ? partes.join(' · ') : undefined,
    };
  }, [conteudos, lidos]);

  function confirmDelete(conteudo: Conteudo) {
    Alert.alert(
      'Excluir devocional',
      `Excluir "${conteudo.titulo}"? Essa ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () =>
            excluirConteudo.mutate(conteudo.id, {
              onError: (e) =>
                Alert.alert('Erro', extractErrorMessage(e, 'Não foi possível excluir.')),
            }),
        },
      ],
    );
  }

  function propsDoItem(conteudo: Conteudo) {
    const gerencia = canManage(conteudo);

    return {
      conteudo,
      icone: 'book-open-page-variant-outline' as const,
      lido: lidos.has(conteudo.id),
      meta: [
        // Só o primeiro nome: a linha tem largura de miniatura e "José
        // Carlos de Oliveira Marques" comeria a data inteira nas reticências.
        conteudo.autor.nomeCompleto.split(' ')[0]!,
        `${minutosDeLeitura(conteudo.texto)} min`,
      ],
      onPress: () =>
        navigation.navigate('DevocionalDetail', { id: String(conteudo.id) }),
      onEditar: gerencia
        ? () => navigation.navigate('CreateConteudo', { id: String(conteudo.id) })
        : undefined,
      onExcluir: gerencia ? () => confirmDelete(conteudo) : undefined,
    };
  }

  const criar = () => navigation.navigate('CreateConteudo', { tipo: 'Devocional' });

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScreenHeader
        title="Devocionais"
        subtitle={resumo}
        onBack={() => navigation.goBack()}
        actionLabel={isLeader ? 'Novo devocional' : undefined}
        onActionPress={isLeader ? criar : undefined}
        acaoCompacta
        busy={isFetching && !isLoading}
      />

      <ScrollView
        className="flex-1 bg-background px-gutter"
        contentContainerClassName="pb-3xl"
      >
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 48 }} />
        ) : error ? (
          <View className="items-center gap-md py-3xl">
            <Text className="text-center font-sans text-[14px] text-ink-muted">{error}</Text>
            <Pressable onPress={() => refetch()} hitSlop={12}>
              <Text className="font-sans-semibold text-[14px] text-secondary">
                Tentar novamente
              </Text>
            </Pressable>
          </View>
        ) : !capa ? (
          <ListaVazia
            icone="book-open-page-variant-outline"
            titulo="Ainda não há devocionais"
            descricao="Reflexões preparadas pelos pastores para fortalecer sua caminhada com Cristo aparecem aqui."
            acao={
              isLeader ? (
                <TileCriar rotulo="Publicar o primeiro devocional" onPress={criar} />
              ) : undefined
            }
          />
        ) : (
          <View className="pt-lg">
            <ItemDestaque {...propsDoItem(capa)} />

            {restante.length > 0 ? (
              <>
                <TituloGrupo>Anteriores</TituloGrupo>
                {restante.map((item, i) => (
                  <ItemLista
                    key={item.id}
                    {...propsDoItem(item)}
                    ultimo={i === restante.length - 1}
                  />
                ))}
              </>
            ) : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
