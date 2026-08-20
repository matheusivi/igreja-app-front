import { Pressable, Text, View } from 'react-native';
import { radius, spacing } from '../constants/theme';
import { useThemeColors } from '../hooks/useThemeColors';
import {
  PAPEIS_FAMILIA,
  rotuloPapel,
  type PapelFamilia,
} from '../services/groups.service';

/**
 * Escolher o papel de alguém na família.
 *
 * ═══ POR QUE NÃO É MAIS UM CAMPO DE TEXTO ═══
 * Era um `TextField` com placeholder "Ex: Filho, Cônjuge". Texto livre num
 * campo assim produz "Filho", "filho", "FILHO", "fiho" e "Filho do João" como
 * cinco valores diferentes — e este cadastro existe justamente para responder
 * quem responde por qual criança na comunidade. Dado que não dá para contar
 * nem filtrar não sustenta esse uso.
 *
 * ═══ POR QUE PASTILHAS, E NÃO UM PICKER ═══
 * São dez opções, todas curtas. Um seletor nativo esconderia as dez atrás de
 * um toque e de uma folha modal, para economizar espaço que aqui não falta.
 * Com as pastilhas à mostra, a pessoa vê o vocabulário inteiro — inclusive
 * que existe "Avô" e "Sobrinho", que ela talvez nem procurasse.
 *
 * A concordância vem do sexo cadastrado: quem está escolhendo o papel de
 * Maria lê "Filha", não "Filho".
 */

type Props = {
  valor: PapelFamilia | null;
  onChange: (papel: PapelFamilia | null) => void;
  /** Sexo de quem vai RECEBER o papel — decide a palavra de cada pastilha. */
  sexo?: string | null;
  desabilitado?: boolean;
};

export function SeletorPapel({ valor, onChange, sexo, desabilitado = false }: Props) {
  const colors = useThemeColors();

  return (
    <View className="flex-row flex-wrap gap-sm">
      {PAPEIS_FAMILIA.map((papel) => {
        const ativo = valor === papel;
        const rotulo = rotuloPapel(papel, sexo)!;

        return (
          <Pressable
            key={papel}
            accessibilityRole="button"
            accessibilityState={{ selected: ativo, disabled: desabilitado }}
            accessibilityLabel={rotulo}
            disabled={desabilitado}
            // Tocar no que já está escolhido limpa. É como se desfaz uma
            // escolha feita por engano sem precisar de um botão "nenhum",
            // que ficaria na lista fingindo ser mais um papel.
            onPress={() => onChange(ativo ? null : papel)}
            // Nenhuma aparência no Pressable: o NativeWind escreve o
            // `className` no mesmo prop `style`, e o que perde o merge some.
            style={({ pressed }) => ({
              opacity: pressed ? 0.7 : desabilitado ? 0.5 : 1,
            })}
          >
            <View
              style={{
                minHeight: 44,
                justifyContent: 'center',
                paddingHorizontal: spacing.lg,
                borderRadius: radius.full,
                borderWidth: 1,
                borderColor: ativo ? colors.primary : colors.outlineVariant,
                backgroundColor: ativo ? colors.primary : 'transparent',
              }}
            >
              <Text
                className="font-sans-semibold text-[14px]"
                style={{ color: ativo ? colors.onPrimary : colors.ink }}
              >
                {rotulo}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
