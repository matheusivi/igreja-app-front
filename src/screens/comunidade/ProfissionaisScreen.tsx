import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, TextField, TopBar } from '../../components';
import { elevation, radius, spacing, tracking } from '../../constants/theme';
import { useProfissionais, profissionaisKeys } from '../../hooks/queries/useProfissionais';
import { useThemeColors } from '../../hooks/useThemeColors';
import type { AppStackParamList } from '../../navigation/types';
import { extractErrorMessage } from '../../services/api';
import { rotuloProfissao } from '../../services/profissoes';
import type { Profissional } from '../../services/users.service';
import { linkWhatsapp, maskPhone } from '../../utils/masks';
import { useAtualizarPuxando } from '../../hooks/useAtualizarPuxando';

type Props = NativeStackScreenProps<AppStackParamList, 'Profissionais'>;

/**
 * O trabalho da própria comunidade.
 *
 * ═══ PARA QUE ISTO EXISTE ═══
 * A igreja tem pedreiro, costureira, professora, eletricista — e ninguém
 * sabe. Quem precisa de um serviço procura fora e paga a estranho, enquanto
 * o irmão do lado está sem trabalho. Uma lista resolve isso sem intermediar
 * nada: aproxima quem precisa de quem faz, e sai da frente.
 *
 * ═══ SÓ QUEM PEDIU PARA ESTAR AQUI ═══
 * Ninguém entra por ter preenchido "profissão" no cadastro. Aquilo foi
 * informado para ser membro, não para virar anúncio com telefone. O
 * interruptor fica no Editar perfil, desligado por padrão.
 *
 * O efeito colateral é bom: quem está aqui QUER ser procurado, então o
 * contato chega desejado em vez de invasivo.
 *
 * ═══ SEM IDADE ═══
 * Ela não ajuda a escolher um eletricista e abre porta para preconceito. A
 * data de nascimento fica no servidor e serve a uma coisa só: barrar menores
 * de idade de uma lista que expõe telefone e foto.
 *
 * ═══ `FlatList`, E NÃO `ScrollView` ═══
 * É a única tela do app com lista potencialmente longa e rolagem infinita.
 * `ScrollView` monta todos os itens de uma vez; com 200 cartões e 200 fotos
 * isso trava o aparelho. A `FlatList` recicla as linhas fora da tela.
 */
export function ProfissionaisScreen({ navigation }: Props) {
  // Quem acabou de ligar o interruptor no perfil aparece aqui ao puxar.
  const { controle } = useAtualizarPuxando([profissionaisKeys.todos]);

  const colors = useThemeColors();
  const [busca, setBusca] = useState('');

  const {
    profissionais,
    total,
    carregando,
    carregandoMais,
    temMais,
    carregarMais,
    erro,
    termoCurto,
  } = useProfissionais(busca);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <TopBar title="Trabalhos da comunidade" onBack={() => navigation.goBack()} />

      <FlatList
        refreshControl={controle}
        data={profissionais}
        keyExtractor={(item) => String(item.id)}
        className="flex-1 bg-background"
        contentContainerStyle={{
          paddingHorizontal: spacing.gutter,
          paddingBottom: spacing['3xl'],
          gap: spacing.md,
        }}
        keyboardShouldPersistTaps="handled"
        // Dispara antes de o fim aparecer, para a próxima página já estar a
        // caminho quando a pessoa chegar lá. 0.5 = meia tela de antecedência.
        onEndReachedThreshold={0.5}
        onEndReached={carregarMais}
        ListHeaderComponent={
          <View className="gap-md pb-md pt-lg">
            <TextField
              label="Procurar"
              placeholder="Profissão, especialidade ou nome"
              value={busca}
              onChangeText={setBusca}
              autoCorrect={false}
              returnKeyType="search"
            />
            {!carregando && !erro && total > 0 ? (
              <Text className="font-sans text-[13px] text-ink-muted">
                {total} {total === 1 ? 'pessoa divulgando' : 'pessoas divulgando'}
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          erro ? (
            <Text className="py-xl font-sans text-[14px] text-error">
              {extractErrorMessage(erro)}
            </Text>
          ) : termoCurto ? (
            <Text className="py-md font-sans text-[13px] text-ink-muted">
              Digite pelo menos 2 letras.
            </Text>
          ) : carregando ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
          ) : (
            <Vazio buscando={busca.trim().length > 0} />
          )
        }
        ListFooterComponent={
          carregandoMais ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.lg }} />
          ) : !temMais && profissionais.length > 0 ? (
            <Text className="py-lg text-center font-sans text-[13px] text-ink-muted">
              Você chegou ao fim da lista.
            </Text>
          ) : null
        }
        renderItem={({ item }) => <CartaoProfissional profissional={item} />}
      />
    </SafeAreaView>
  );
}

/* ══════════════════════════════════════════════════════════════════════ */

function CartaoProfissional({ profissional }: { profissional: Profissional }) {
  const colors = useThemeColors();
  const temTelefone = Boolean(profissional.telefone);

  async function abrirWhatsapp() {
    if (!profissional.telefone) return;
    try {
      await Linking.openURL(linkWhatsapp(profissional.telefone));
    } catch {
      // A promessa rejeita em silêncio quando não há app que resolva a URL —
      // o mesmo defeito que já engoliu o toque no bloco de vídeo. Aqui o
      // número aparece no alerta para a pessoa poder ligar mesmo assim.
      Alert.alert(
        'Não foi possível abrir o WhatsApp',
        `Você pode ligar para ${maskPhone(profissional.telefone)}.`,
      );
    }
  }

  return (
    <View
      style={[
        {
          alignSelf: 'stretch',
          gap: spacing.lg,
          padding: spacing.lg,
          borderRadius: radius.lg,
          backgroundColor: colors.surfaceBright,
        },
        elevation.subtle,
      ]}
    >
      <View className="flex-row items-center gap-md">
        <Avatar
          nome={profissional.nomeCompleto}
          fotoUrl={profissional.fotoUrl}
          size={52}
        />

        <View className="flex-1 gap-0.5">
          {/* A PROFISSÃO é o título, não o nome.
              Quem abre esta tela procura um serviço, não uma pessoa: "quem é
              pedreiro aqui?" vem antes de "quem é o Carlos?". O nome importa
              — mas depois, para saber com quem se fala. */}
          <Text
            className="font-serif-bold text-[17px] leading-6 text-ink"
            style={{ letterSpacing: tracking.heading }}
            numberOfLines={2}
          >
            {rotuloProfissao(profissional.profissao) ?? 'Profissional'}
          </Text>
          <Text className="font-sans text-[14px] text-ink-muted" numberOfLines={1}>
            {profissional.nomeCompleto}
          </Text>
        </View>
      </View>

      {profissional.especializacao ? (
        <Text className="font-sans text-[14px] leading-6 text-ink" numberOfLines={3}>
          {profissional.especializacao}
        </Text>
      ) : null}

      {temTelefone ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Chamar ${profissional.nomeCompleto.split(' ')[0]} no WhatsApp`}
          onPress={abrirWhatsapp}
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
        >
          <View
            style={{
              minHeight: 48,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.sm,
              borderRadius: radius.button,
              backgroundColor: colors.primary,
            }}
          >
            <MaterialCommunityIcons
              name="whatsapp"
              size={19}
              color={colors.onPrimary}
            />
            <Text
              className="font-sans-semibold text-[15px]"
              style={{ color: colors.onPrimary }}
            >
              Chamar no WhatsApp
            </Text>
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

function Vazio({ buscando }: { buscando: boolean }) {
  const colors = useThemeColors();
  return (
    <View className="items-center gap-md px-lg py-3xl">
      <MaterialCommunityIcons name="briefcase-search-outline" size={30} color={colors.inkMuted} />
      <Text className="text-center font-serif-bold text-[17px] text-ink">
        {buscando ? 'Nada encontrado' : 'Ninguém divulgando ainda'}
      </Text>
      <Text className="max-w-[300px] text-center font-sans text-[14px] leading-6 text-ink-muted">
        {buscando
          ? 'Tente outra palavra. A busca ignora acento e procura na profissão, na especialidade e no nome.'
          : 'Quem quiser divulgar o próprio trabalho para a igreja ativa a opção no Editar perfil. Você pode ser o primeiro.'}
      </Text>
    </View>
  );
}
