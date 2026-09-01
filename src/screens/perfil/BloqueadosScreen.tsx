import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ListaVazia, ScreenHeader } from '../../components';
import { useThemeColors } from '../../hooks/useThemeColors';
import type { AppStackParamList } from '../../navigation/types';
import { extractErrorMessage } from '../../services/api';
import { urlImagem } from '../../services/imagem';
import {
  moderacaoService,
  type PessoaBloqueada,
} from '../../services/moderacao.service';

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
  const [lista, setLista] = useState<PessoaBloqueada[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  /** Quem está sendo desbloqueado agora, para desabilitar só aquele botão. */
  const [emAndamento, setEmAndamento] = useState<number | null>(null);

  const carregar = useCallback(async () => {
    try {
      setErro(null);
      setLista(await moderacaoService.listarBloqueados());
    } catch (e) {
      setErro(extractErrorMessage(e, 'Não foi possível carregar a lista.'));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  function confirmarDesbloqueio(pessoa: PessoaBloqueada) {
    Alert.alert(
      'Desbloquear',
      `Você voltará a ver as publicações de ${pessoa.nomeCompleto} no mural de oração.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desbloquear',
          onPress: async () => {
            setEmAndamento(pessoa.id);
            try {
              await moderacaoService.desbloquear(pessoa.id);
              // Remoção local em vez de recarregar tudo: a resposta já
              // confirmou, e uma nova requisição só faria a lista piscar.
              setLista((atual) => atual.filter((p) => p.id !== pessoa.id));
            } catch (e) {
              Alert.alert(
                'Erro',
                extractErrorMessage(e, 'Não foi possível desbloquear.'),
              );
            } finally {
              setEmAndamento(null);
            }
          },
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
            {erro}
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

                <Pressable
                  onPress={() => confirmarDesbloqueio(pessoa)}
                  disabled={emAndamento === pessoa.id}
                  hitSlop={8}
                  style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                >
                  <View className="rounded-full border border-outline px-3 py-1.5">
                    <Text className="font-sans-semibold text-[13px] text-secondary">
                      {emAndamento === pessoa.id ? '…' : 'Desbloquear'}
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
