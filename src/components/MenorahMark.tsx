import { View } from 'react-native';

/**
 * Marca única do app — resolve o P0 da auditoria (dois logos concorrentes:
 * ícone de igreja no Cadastro vs. menorá no Login). O `DESIGN.md` original já
 * cita a menorá como motivo central da marca ("padrões geométricos inspirados
 * na Menorah", "The Menorah Rule" — simetria radial). Esta é uma composição
 * geométrica simples (7 hastes, mais alta ao centro) — fácil de trocar depois
 * por um SVG ilustrado sem mudar onde o componente é usado.
 */

const BAR_HEIGHTS = [10, 16, 22, 28, 22, 16, 10];

type MenorahMarkProps = {
  size?: number;
};

export function MenorahMark({ size = 64 }: MenorahMarkProps) {
  return (
    <View
      className="items-center justify-center rounded-xl bg-surface-container-high"
      style={{ width: size, height: size }}
    >
      <View className="flex-row items-end gap-[2px]">
        {BAR_HEIGHTS.map((height, index) => (
          <View
            key={index}
            className="w-[3px] rounded-full bg-primary"
            style={{ height: (height * size) / 64 }}
          />
        ))}
      </View>
      <View
        className="mt-1 rounded-full bg-primary"
        style={{ width: size * 0.5, height: 3 }}
      />
    </View>
  );
}
