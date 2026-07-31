import { Text, View } from 'react-native';

/**
 * Componente de versículo bíblico ("Nova Component" no DESIGN.md original).
 *
 * O spec original pedia uma faixa dourada lateral esquerda. Trocamos por
 * fundo tingido (gold-fixed) + tipografia serifada em itálico + glifo de
 * citação — mesmo destaque espiritual, sem o padrão de "faixa lateral em
 * card" que a auditoria sinalizou como visualmente genérico/datado.
 */

type ScriptureQuoteProps = {
  text: string;
  reference: string;
};

export function ScriptureQuote({ text, reference }: ScriptureQuoteProps) {
  return (
    <View className="gap-2 rounded-lg bg-gold-fixed p-4">
      <Text className="font-serif text-lg italic leading-7 text-on-gold">
        {'“'}
        {text}
        {'”'}
      </Text>
      <Text className="font-sans-semibold text-sm text-primary">— {reference}</Text>
    </View>
  );
}
