import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { spacing } from '../constants/theme';
import { useThemeColors } from '../hooks/useThemeColors';
import type { UsuarioResumo } from '../services/users.service';
import { Avatar } from './Avatar';

/**
 * Uma pessoa da igreja num resultado de busca.
 *
 * ═══ A FAMÍLIA É A SEGUNDA LINHA, SEMPRE ═══
 * Nome sozinho não resolve a pergunta que leva alguém a buscar. "Maria" pode
 * ser quatro Marias; "Maria — Família Souza" é uma. Numa igreja de 400
 * pessoas, a família é o que desambigua, e por isso ela não é detalhe
 * opcional da linha: é o que faz a linha servir.
 *
 * ═══ "SEM FAMÍLIA" TAMBÉM É RESPOSTA ═══
 * Quando não há vínculo, a linha diz isso em vez de ficar vazia. Não é falta
 * de dado — é o dado: essa é exatamente a pessoa que a liderança precisa
 * acolher, e um espaço em branco esconderia justamente quem mais importa
 * encontrar.
 *
 * ═══ BLOQUEADO EXPLICA POR QUÊ ═══
 * No convite, quem já tem família não pode ser escolhido — o servidor recusa
 * com 409. A linha mostra o motivo ANTES do toque. Item desabilitado sem
 * explicação faz a pessoa tocar de novo mais forte, achando que o app travou.
 */

type Props = {
  usuario: UsuarioResumo;
  onPress?: () => void;
  /** Substitui a linha de família e desabilita o toque. */
  bloqueio?: string | null;
  selecionado?: boolean;
  ultimo?: boolean;
  /**
   * Troca o texto da segunda linha sem desabilitar nada.
   *
   * Diferente de `bloqueio`, que também impede o toque. Na gestão de
   * liderança a segunda linha diz o CARGO, não a família — ali a família não
   * é a pergunta, e mostrar "Sem família cadastrada" embaixo de cada nome
   * seria ruído sobre uma decisão que não tem nada a ver com isso.
   */
  descricao?: string;
  /**
   * Ocupa o lugar da seta, à direita.
   *
   * A seta promete "isto abre uma tela". Quando a linha existe para uma ação
   * feita ali mesmo — promover, rebaixar — a seta vira promessa falsa, e o
   * encaixe evita ter que duplicar a linha inteira só por causa da ponta.
   */
  acao?: ReactNode;
};

export function LinhaMembro({
  usuario,
  onPress,
  bloqueio,
  selecionado = false,
  ultimo = false,
  descricao,
  acao,
}: Props) {
  const colors = useThemeColors();
  const ehLideranca = ['Líder', 'Pastor', 'Administrador'].includes(usuario.perfil);
  const desabilitado = Boolean(bloqueio);

  const secundaria =
    bloqueio ?? descricao ?? usuario.familia ?? 'Sem família cadastrada';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: selecionado, disabled: desabilitado }}
      accessibilityLabel={`${usuario.nomeCompleto}. ${secundaria}`}
      disabled={desabilitado || !onPress}
      onPress={onPress}
      // Nenhuma aparência no Pressable: o NativeWind escreve o `className` no
      // mesmo prop `style`, e o que perde o merge não existe.
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : desabilitado ? 0.55 : 1 })}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          paddingVertical: spacing.md,
          paddingHorizontal: selecionado ? spacing.md : 0,
          borderRadius: selecionado ? 10 : 0,
          backgroundColor: selecionado ? colors.secondarySoft : 'transparent',
          borderBottomWidth: ultimo || selecionado ? 0 : 1,
          borderBottomColor: colors.outlineVariant,
          // 48 de altura mínima: avatar de 40 mais o respiro já passam disso,
          // mas fixar aqui impede que um nome curto encolha a linha abaixo do
          // alvo de toque.
          minHeight: 56,
        }}
      >
        <Avatar nome={usuario.nomeCompleto} fotoUrl={usuario.fotoUrl} size={40} />

        <View style={{ flex: 1, gap: 2 }}>
          <View className="flex-row items-center gap-sm">
            <Text
              className="flex-shrink font-sans-semibold text-[15px]"
              style={{ color: selecionado ? colors.onSecondarySoft : colors.ink }}
              numberOfLines={1}
            >
              {usuario.nomeCompleto}
            </Text>
            {ehLideranca ? (
              <Text
                className="font-sans-semibold text-[12px]"
                style={{ color: colors.secondary }}
              >
                {usuario.perfil}
              </Text>
            ) : null}
          </View>

          <View className="flex-row items-center gap-1">
            <MaterialCommunityIcons
              name={
                bloqueio
                  ? 'information-outline'
                  : descricao
                    ? 'shield-account-outline'
                    : usuario.familia
                      ? 'home-heart'
                      : 'account-question-outline'
              }
              size={13}
              color={selecionado ? colors.onSecondarySoft : colors.inkMuted}
            />
            <Text
              className="flex-1 font-sans text-[13px]"
              style={{ color: selecionado ? colors.onSecondarySoft : colors.inkMuted }}
              numberOfLines={1}
            >
              {secundaria}
            </Text>
          </View>
        </View>

        {acao ? (
          acao
        ) : selecionado ? (
          <MaterialCommunityIcons
            name="check-circle"
            size={20}
            color={colors.onSecondarySoft}
          />
        ) : desabilitado ? null : onPress ? (
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={colors.inkMuted}
          />
        ) : null}
      </View>
    </Pressable>
  );
}
