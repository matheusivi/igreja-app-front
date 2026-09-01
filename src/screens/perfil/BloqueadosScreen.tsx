import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ListaVazia, ScreenHeader } from '../../components';
import { useBloqueados, useDesbloquear } from '../../hooks/queries/useModeracao';
import { useThemeColors } from '../../hooks/useThemeColors';
import type { AppStackParamList } from '../../navigation/types';
import { extractErrorMessage } from '../../services/api';
import { urlImagem } from '../../services/imagem';
import type { PessoaBloqueada } from '../../services/moderacao.service';

type Props = NativeStackScreenProps<AppStackParamList, 'Bloqueados'>;

/**
 * Quem a pessoa escolheu não ver mais no mural.
 *
 * ═══ POR QUE ESTA TELA PRECISA EXISTIR ═══
 * Não basta poder bloquear: as lojas exigem que dê para **rever e desfazer**.
 * Sem isso, um toque errado ficaria valendo para sempre, sem lugar nenhum onde
 * a pessoa pudesse consertar.
 *
 * E é o caso comum, não o raro. Numa igreja, desavença passa. Quem bloqueou no
 * calor de uma discussão vai querer voltar atrás depois de conversar — e
 * precisa achar onde.
 */
export function BloqueadosScreen({ navigation }: Props) {
  const colors = useThemeColors();

  /**
   * A mesma consulta que o Perfil usa para decidir se mostra a entrada
   * "Pessoas bloqueadas". Compartilhando o cache, as duas telas custam UMA
   * requisição — e desbloquear aqui faz a entrada sumir de lá sozinha, porque
   * a mutação invalida a chave comum.
   */
  const { bloqueados: lista, carregando, erro } = useBloqueados();
  const desbloquear = useDesbloquear();

  function confirmarDesbloqueio(pessoa: PessoaBloqueada) {
    Alert.alert(
      'Desbloquear',
      `Você voltará a ver as publicações de ${pessoa.nomeCompleto} no mural de oração.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desbloquear',
          onPress: () =>
            desbloquear.mutate(pessoa.id, {
              onError: (e) =>
                Alert.alert(
                  'Erro',
                  extractErrorMessage(e, 'Não foi possível desbloquear.'),
                ),
            }),
        },
      ],
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScreenHeader
        title="Pessoas bloqueadas"
        subtitle={
          lista.length > 0
            ? `${lista.length} ${lista.length === 1 ? 'pessoa' : 'pessoas'}`
            : undefined
        }
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        className="flex-1 px-gutter"
        contentContainerClassName="pb-3xl pt-lg"
      >
        {carregando ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ marginTop: 48 }}
          />
        ) : erro ? (
          <Text className="py-3xl text-center font-sans text-[14px] text-ink-muted">
            {extractErrorMessage(erro, 'Não foi possível carregar a lista.')}
          </Text>
        ) : lista.length === 0 ? (
          <ListaVazia
            // MaterialCommunityIcons, não Ionicons — é o conjunto que o
            // ListaVazia usa.
            icone="shield-check-outline"
            titulo="Ninguém bloqueado"
            descricao="Se algum pedido de oração te incomodar, você pode bloquear a pessoa pelo menu do próprio pedido. Ela não é avisada, e some apenas do seu mural."
          />
        ) : (
          <View className="gap-2">
            {lista.map((pessoa) => (
              <View
                key={pessoa.id}
                className="flex-row items-center gap-3 rounded-lg border border-outline-variant p-3"
              >
                {pessoa.fotoUrl ? (
                  <Image
                    source={{
                      uri: urlImagem(pessoa.fotoUrl, {
                        largura: 96,
                        altura: 96,
                      }),
                    }}
                    className="h-11 w-11 rounded-full"
                  />
                ) : (
                  <View className="h-11 w-11 items-center justify-center rounded-full bg-surface-container-high">
                    <Text className="font-sans-semibold text-[15px] text-ink-muted">
                      {pessoa.nomeCompleto.trim().charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}

                <Text className="flex-1 font-sans-medium text-[15px] text-ink">
                  {pessoa.nomeCompleto}
                </Text>

                {/*
                  `variables` guarda o argumento da mutação em andamento — é
                  como saber QUAL linha está sendo desbloqueada sem manter um
                  estado próprio para isso. Com uma flag booleana, todas as
                  linhas mostrariam "…" ao mesmo tempo.
                */}
                <Pressable
                  onPress={() => confirmarDesbloqueio(pessoa)}
                  disabled={
                    desbloquear.isPending && desbloquear.variables === pessoa.id
                  }
                  hitSlop={8}
                  style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                >
                  <View className="rounded-full border border-outline px-3 py-1.5">
                    <Text className="font-sans-semibold text-[13px] text-secondary">
                      {desbloquear.isPending && desbloquear.variables === pessoa.id
                        ? '…'
                        : 'Desbloquear'}
                    </Text>
                  </View>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
