import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, ScrollView, Share, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, ScriptureQuote } from '../components';
import { useThemeColors } from '../hooks/useThemeColors';
import { NOME_IGREJA, PIX } from '../constants/igreja';
import type { AppStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'Contribuir'>;

/**
 * A chave, como ela é MOSTRADA.
 *
 * O que se copia é sempre `PIX.valor` cru — pontuação quebra a leitura do
 * banco. A máscara existe só para os olhos: 14 dígitos colados são
 * impossíveis de conferir contra o papel do tesoureiro.
 *
 * Só o CNPJ é mascarado porque só ele tem formato fixo. Telefone e e-mail a
 * pessoa já reconhece; chave aleatória não tem forma nenhuma para impor.
 */
function chaveParaLeitura(valor: string): string {
  if (PIX.tipo !== 'CNPJ') return valor;
  return valor.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5',
  );
}

export function ContribuirScreen({ navigation }: Props) {
  const colors = useThemeColors();
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    // Copia sem pontuação: é o formato que os aplicativos de banco aceitam
    // como chave PIX. O formatado serve só para a leitura na tela.
    await Clipboard.setStringAsync(PIX.valor);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center justify-between border-b border-outline-variant px-gutter py-3">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </Pressable>
        <Text className="font-serif-bold text-base text-primary">Dízimos e ofertas</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView className="flex-1 px-gutter" contentContainerClassName="gap-xl py-3xl">
        <ScriptureQuote
          text="Cada um contribua segundo tiver proposto no coração, não com tristeza ou por necessidade; porque Deus ama ao que dá com alegria."
          reference="2 Coríntios 9:7"
        />

        <Card accent contentClassName="items-center gap-3 py-6">
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-surface-container-high">
            <Ionicons name="qr-code-outline" size={28} color={colors.gold} />
          </View>

          <View className="items-center gap-1">
            <Text className="font-sans-semibold text-xs uppercase tracking-wide text-ink-muted">
              Chave PIX · {PIX.tipo}
            </Text>
            <Text className="font-serif-bold text-xl text-ink">
              {chaveParaLeitura(PIX.valor)}
            </Text>
            <Text className="text-center font-sans text-xs text-ink-muted">
              {NOME_IGREJA}
            </Text>
          </View>

          <Pressable
            onPress={copiar}
            className={[
              'w-full flex-row items-center justify-center gap-2 rounded-lg py-3',
              copiado ? 'bg-success-soft' : 'bg-gold',
            ].join(' ')}
            accessibilityRole="button"
            accessibilityLabel="Copiar chave PIX"
          >
            <Ionicons
              name={copiado ? 'checkmark-circle' : 'copy-outline'}
              size={18}
              color={copiado ? colors.success : colors.onGold}
            />
            <Text
              className={[
                'font-sans-semibold text-sm',
                copiado ? 'text-on-success' : 'text-on-gold',
              ].join(' ')}
            >
              {copiado ? 'Chave copiada!' : 'Copiar chave PIX'}
            </Text>
          </Pressable>
        </Card>

        <Card contentClassName="gap-3">
          <Text className="font-sans-semibold text-xs uppercase tracking-wide text-ink-muted">
            Como contribuir
          </Text>
          {[
            'Copie a chave PIX acima.',
            'Abra o aplicativo do seu banco e escolha PIX.',
            'Cole a chave, informe o valor e confirme.',
          ].map((passo, i) => (
            <View key={i} className="flex-row items-start gap-3">
              <View className="h-6 w-6 items-center justify-center rounded-full bg-surface-container-high">
                <Text className="font-sans-semibold text-xs text-primary">{i + 1}</Text>
              </View>
              <Text className="flex-1 font-sans text-sm leading-5 text-ink">{passo}</Text>
            </View>
          ))}
        </Card>

        <Pressable
          onPress={() =>
            void Share.share({
              message: `Chave PIX da ${NOME_IGREJA} (${PIX.tipo}): ${PIX.valor}`,
            })
          }
          className="flex-row items-center justify-center gap-2 py-2"
          hitSlop={8}
        >
          <Ionicons name="share-social-outline" size={16} color={colors.secondary} />
          <Text className="font-sans-semibold text-sm text-secondary">
            Compartilhar a chave
          </Text>
        </Pressable>

        {/* O app não processa pagamento nem registra quem contribuiu — a
            transação acontece inteira no banco da pessoa. Dizer isso evita a
            expectativa de ver um comprovante ou histórico aqui depois. */}
        <Text className="text-center font-sans text-xs leading-4 text-ink-muted">
          A contribuição é feita direto no aplicativo do seu banco. O app da
          igreja apenas mostra a chave — nenhum dado bancário passa por aqui.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
