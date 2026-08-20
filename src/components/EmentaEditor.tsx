import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';
import {
  novoIdEmenta,
  type ItemEmenta,
} from '../services/courses.service';

type EmentaEditorProps = {
  itens: ItemEmenta[];
  onChange: (itens: ItemEmenta[]) => void;
};

/**
 * Editor da ementa do curso.
 *
 * Divisões ("Parte 1 – Comunicação") e aulas convivem na mesma lista, porque
 * é assim que a pessoa pensa a sequência. A numeração das aulas é derivada da
 * posição, nunca digitada — assim reordenar ou remover não deixa buracos na
 * contagem, que é o erro clássico de ementa mantida à mão.
 */
export function EmentaEditor({ itens, onChange }: EmentaEditorProps) {
  const colors = useThemeColors();

  function atualizarTexto(id: string, texto: string) {
    onChange(
      itens.map((item) =>
        item.id !== id
          ? item
          : item.tipo === 'secao'
            ? { ...item, texto }
            : { ...item, titulo: texto },
      ),
    );
  }

  function remover(id: string) {
    onChange(itens.filter((item) => item.id !== id));
  }

  function mover(index: number, direcao: -1 | 1) {
    const destino = index + direcao;
    if (destino < 0 || destino >= itens.length) return;
    const copia = [...itens];
    const [movido] = copia.splice(index, 1);
    copia.splice(destino, 0, movido!);
    onChange(copia);
  }

  function adicionar(tipo: ItemEmenta['tipo']) {
    const novo: ItemEmenta =
      tipo === 'secao'
        ? { id: novoIdEmenta(), tipo: 'secao', texto: '' }
        : { id: novoIdEmenta(), tipo: 'capitulo', titulo: '' };
    onChange([...itens, novo]);
  }

  // A numeração exibida ignora as divisões, igual ao que vai para o banco.
  let numero = 0;

  return (
    <View className="gap-2">
      <Text className="font-sans-semibold text-xs uppercase tracking-wide text-ink-muted">
        Ementa do curso
      </Text>
      <Text className="font-sans text-xs leading-4 text-ink-muted">
        Os temas estudados semana a semana. Aparecem no curso como "O que você
        vai estudar".
      </Text>

      {itens.length === 0 ? (
        <View className="items-center gap-1 rounded-lg border border-dashed border-outline-variant py-6">
          <Ionicons name="list-outline" size={24} color={colors.outline} />
          <Text className="font-sans text-sm text-ink-muted">
            Nenhuma aula cadastrada ainda.
          </Text>
        </View>
      ) : (
        <View className="gap-2">
          {itens.map((item, index) => {
            const isSecao = item.tipo === 'secao';
            if (!isSecao) numero += 1;

            return (
              <View
                key={item.id}
                className={[
                  'flex-row items-center gap-2 rounded-lg border px-2 py-1.5',
                  isSecao
                    ? 'border-secondary bg-surface-container-low'
                    : 'border-outline-variant bg-surface-container-low',
                ].join(' ')}
              >
                {isSecao ? (
                  <Ionicons name="bookmark" size={15} color={colors.secondary} />
                ) : (
                  <Text className="w-6 text-center font-serif-bold text-sm text-gold">
                    {numero}
                  </Text>
                )}

                <TextInput
                  className="flex-1 font-sans text-sm text-ink"
                  placeholder={
                    isSecao ? 'Ex: Parte 1 – Comunicação' : 'Título da aula'
                  }
                  placeholderTextColor={colors.outline}
                  value={isSecao ? item.texto : item.titulo}
                  onChangeText={(v) => atualizarTexto(item.id, v)}
                  multiline
                />

                <Pressable
                  onPress={() => mover(index, -1)}
                  disabled={index === 0}
                  hitSlop={6}
                  accessibilityLabel="Mover para cima"
                >
                  <Ionicons
                    name="chevron-up"
                    size={18}
                    color={index === 0 ? colors.outlineVariant : colors.ink}
                  />
                </Pressable>
                <Pressable
                  onPress={() => mover(index, 1)}
                  disabled={index === itens.length - 1}
                  hitSlop={6}
                  accessibilityLabel="Mover para baixo"
                >
                  <Ionicons
                    name="chevron-down"
                    size={18}
                    color={
                      index === itens.length - 1
                        ? colors.outlineVariant
                        : colors.ink
                    }
                  />
                </Pressable>
                <Pressable
                  onPress={() => remover(item.id)}
                  hitSlop={6}
                  accessibilityLabel="Remover"
                >
                  <Ionicons name="close" size={18} color={colors.error} />
                </Pressable>
              </View>
            );
          })}
        </View>
      )}

      <View className="flex-row gap-2">
        <Pressable
          onPress={() => adicionar('capitulo')}
          className="flex-1 flex-row items-center justify-center gap-1.5 rounded-lg border border-outline-variant py-2.5"
        >
          <Ionicons name="add" size={16} color={colors.secondary} />
          <Text className="font-sans-semibold text-sm text-secondary">
            Adicionar aula
          </Text>
        </Pressable>
        <Pressable
          onPress={() => adicionar('secao')}
          className="flex-1 flex-row items-center justify-center gap-1.5 rounded-lg border border-outline-variant py-2.5"
        >
          <Ionicons name="bookmark-outline" size={15} color={colors.secondary} />
          <Text className="font-sans-semibold text-sm text-secondary">
            Adicionar divisão
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
