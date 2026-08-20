import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { radius, spacing, tracking } from '../constants/theme';
import { useThemeColors } from '../hooks/useThemeColors';
import { CATEGORIAS_PROFISSAO, rotuloProfissao } from '../services/profissoes';

/**
 * Escolher a profissão numa lista fechada.
 *
 * ═══ POR QUE NÃO PASTILHAS, COMO O PAPEL NA FAMÍLIA ═══
 * Papel na família são dez opções de uma palavra: cabem à mostra. Profissão
 * são sessenta e seis, em nove categorias. Sessenta e seis pastilhas viram
 * uma parede que ninguém lê, e o formulário do perfil passaria a ser
 * majoritariamente esta lista.
 *
 * Então é um CAMPO que abre uma folha. O campo mostra a escolha atual (que é
 * o que interessa 99% do tempo) e a folha aparece só na hora de decidir.
 *
 * ═══ A BUSCA DENTRO DA FOLHA ═══
 * Com sessenta e seis itens, rolar até "Vidraceiro" é trabalho. Quem já sabe
 * o que é digita três letras e chega. Quem não sabe percorre as categorias —
 * e é justamente aí que descobre que "Cuidador de idosos" existe, algo que
 * nunca digitaria por conta própria.
 *
 * A busca ignora acento, como o resto do app: "medico" encontra "Médico".
 */

type Props = {
  valor: string | null;
  onChange: (chave: string | null) => void;
  label?: string;
};

function semAcento(t: string) {
  return t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export function SeletorProfissao({ valor, onChange, label = 'Profissão' }: Props) {
  const colors = useThemeColors();
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState('');

  const categorias = useMemo(() => {
    const termo = semAcento(busca.trim());
    if (!termo) return CATEGORIAS_PROFISSAO;

    // Categorias que ficam sem nenhum item somem — cabeçalho de seção vazia
    // é ruído que faz a lista parecer mais longa do que o resultado é.
    return CATEGORIAS_PROFISSAO.map((c) => ({
      ...c,
      profissoes: c.profissoes.filter((p) => semAcento(p.nome).includes(termo)),
    })).filter((c) => c.profissoes.length > 0);
  }, [busca]);

  const escolhido = rotuloProfissao(valor);

  function escolher(chave: string | null) {
    onChange(chave);
    setBusca('');
    setAberto(false);
  }

  return (
    <View className="gap-xs">
      <Text className="font-sans-medium text-[13px] text-ink-muted">{label}</Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={escolhido ? `Profissão: ${escolhido}` : 'Escolher profissão'}
        onPress={() => setAberto(true)}
        // Nenhuma aparência no Pressable: o NativeWind escreve o `className`
        // no mesmo prop `style`, e o que perde o merge não existe.
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        <View
          style={{
            minHeight: 52,
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            paddingHorizontal: spacing.lg,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.outlineVariant,
            backgroundColor: colors.surfaceBright,
          }}
        >
          <Text
            className="flex-1 font-sans text-[15px]"
            style={{ color: escolhido ? colors.ink : colors.outline }}
            numberOfLines={1}
          >
            {escolhido ?? 'Escolher da lista'}
          </Text>

          {escolhido ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Limpar profissão"
              hitSlop={12}
              onPress={() => escolher(null)}
            >
              <MaterialCommunityIcons name="close" size={18} color={colors.inkMuted} />
            </Pressable>
          ) : null}

          <MaterialCommunityIcons name="chevron-down" size={20} color={colors.inkMuted} />
        </View>
      </Pressable>

      <Modal
        visible={aberto}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setAberto(false)}
      >
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View
            className="flex-row items-center justify-between px-gutter"
            style={{ height: 56 }}
          >
            <Text
              className="font-serif-bold text-[17px] text-ink"
              style={{ letterSpacing: tracking.heading }}
            >
              Qual é a sua profissão?
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fechar"
              hitSlop={12}
              onPress={() => setAberto(false)}
            >
              <MaterialCommunityIcons name="close" size={24} color={colors.ink} />
            </Pressable>
          </View>

          <View className="px-gutter pb-md">
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                minHeight: 48,
                paddingHorizontal: spacing.lg,
                borderRadius: radius.md,
                backgroundColor: colors.surfaceDim,
              }}
            >
              <MaterialCommunityIcons name="magnify" size={18} color={colors.inkMuted} />
              <TextInput
                className="flex-1 font-sans text-[15px] text-ink"
                placeholder="Procurar"
                placeholderTextColor={colors.outline}
                value={busca}
                onChangeText={setBusca}
                autoCorrect={false}
              />
            </View>
          </View>

          <ScrollView
            className="flex-1 px-gutter"
            contentContainerStyle={{ paddingBottom: spacing['3xl'] }}
            keyboardShouldPersistTaps="handled"
          >
            {categorias.length === 0 ? (
              <Text className="py-xl text-center font-sans text-[14px] leading-6 text-ink-muted">
                Nenhuma profissão com esse nome. Escolha "Outro" e descreva o seu
                trabalho no campo de especialidade.
              </Text>
            ) : (
              categorias.map((categoria) => (
                <View key={categoria.chave} className="pt-lg">
                  <Text
                    className="pb-xs font-serif text-[13px] text-ink-muted"
                    style={{ letterSpacing: tracking.heading }}
                  >
                    {categoria.nome}
                  </Text>

                  {categoria.profissoes.map((profissao, i) => {
                    const ativo = valor === profissao.chave;
                    return (
                      <Pressable
                        key={profissao.chave}
                        accessibilityRole="button"
                        accessibilityState={{ selected: ativo }}
                        accessibilityLabel={profissao.nome}
                        onPress={() => escolher(profissao.chave)}
                        style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                      >
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            minHeight: 48,
                            borderBottomWidth:
                              i === categoria.profissoes.length - 1 ? 0 : 1,
                            borderBottomColor: colors.outlineVariant,
                          }}
                        >
                          <Text
                            className="flex-1 font-sans text-[15px]"
                            style={{ color: ativo ? colors.primary : colors.ink }}
                          >
                            {profissao.nome}
                          </Text>
                          {ativo ? (
                            <MaterialCommunityIcons
                              name="check"
                              size={19}
                              color={colors.primary}
                            />
                          ) : null}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
