import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, ScreenHeader, TextField } from '../../components';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuth } from '../../navigation/AuthContext';
import type { AppStackParamList } from '../../navigation/types';
import { extractErrorMessage } from '../../services/api';
import { authService } from '../../services/auth.service';

type Props = NativeStackScreenProps<AppStackParamList, 'ExcluirConta'>;

/** O que some, na ordem em que a pessoa pensaria nisso. */
const SERA_APAGADO = [
  'Seu nome, e-mail, foto, telefone e data de nascimento',
  'Seus pedidos de oração',
  'Seu progresso no plano de leitura',
  'Sua participação nos grupos familiares',
  'Suas matrículas e o histórico de cursos',
];

/**
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║  EXCLUIR A PRÓPRIA CONTA                                              ║
 * ╚═══════════════════════════════════════════════════════════════════════╝
 *
 * Google e Apple exigem que quem cria conta consiga apagá-la de dentro do app.
 * Desativar, congelar ou "fale com o suporte" não contam.
 *
 * ═══ POR QUE ESTA TELA É DESAGRADÁVEL DE PROPÓSITO ═══
 * Três obstáculos, cada um contra um jeito diferente de errar:
 *
 *   1. TELA SEPARADA         → o toque distraído ao lado de "Sair" não chega aqui
 *   2. LISTA DO QUE SE PERDE → decide sabendo, não imaginando
 *   3. SENHA + CONFIRMAÇÃO   → prova que é a dona, e não quem pegou o aparelho
 *
 * A saída fácil era um `Alert` com "Tem certeza?". Mas isso não informa nada:
 * quem toca em "Sim" não sabe mais do que sabia antes de perguntarem.
 *
 * ═══ O QUE DELIBERADAMENTE NÃO TEM AQUI ═══
 * Nenhuma tentativa de convencer a ficar. Sem "sentiremos sua falta", sem
 * oferecer pausar em vez de excluir, sem esconder o botão. Quem chegou nesta
 * tela já decidiu, e transformar a saída em negociação é desrespeito — além de
 * ser o padrão que as duas lojas passaram a punir.
 */
export function ExcluirContaScreen({ navigation }: Props) {
  const colors = useThemeColors();
  const { signOut } = useAuth();

  const [senha, setSenha] = useState('');
  const [confirmado, setConfirmado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function excluir() {
    setErro(null);
    setEnviando(true);
    try {
      await authService.excluirConta(senha);
      /**
       * Sem navegar para lugar nenhum: `signOut` limpa a sessão e o
       * AuthContext troca a pilha inteira para a de login. Navegar junto
       * disputaria com essa troca e faria piscar uma tela já morta.
       */
      await signOut();
    } catch (e) {
      setErro(extractErrorMessage(e, 'Não foi possível excluir a conta.'));
      setEnviando(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScreenHeader
        title="Excluir minha conta"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        className="flex-1 px-gutter"
        contentContainerClassName="gap-lg pb-3xl pt-lg"
        keyboardShouldPersistTaps="handled"
      >
        {/* Borda vermelha em vez de bloco vermelho: chama atenção sem gritar,
            e sobrevive à troca de tema — não existe token de fundo de erro. */}
        <View className="flex-row items-start gap-3 rounded-lg border border-error bg-surface-container-low p-4">
          <Ionicons name="warning-outline" size={20} color={colors.error} />
          <Text className="flex-1 font-sans-semibold text-[15px] leading-6 text-error">
            Esta ação não pode ser desfeita. Não existe como recuperar a conta
            depois.
          </Text>
        </View>

        <View className="gap-2">
          <Text className="font-sans-semibold text-[15px] text-ink">
            O que será apagado
          </Text>
          {SERA_APAGADO.map((item) => (
            <View key={item} className="flex-row gap-2">
              <Text className="font-sans text-[14px] leading-5 text-ink-muted">
                •
              </Text>
              <Text className="flex-1 font-sans text-[14px] leading-5 text-ink-muted">
                {item}
              </Text>
            </View>
          ))}
        </View>

        {/*
          Honestidade sobre o que NÃO some. Avisos e eventos publicados por
          liderança são comunicação da igreja, não conteúdo pessoal — e a
          pessoa merece saber disso antes, não descobrir depois.
        */}
        <View className="gap-2 rounded-lg border border-outline-variant p-4">
          <Text className="font-sans-semibold text-[14px] text-ink">
            O que permanece
          </Text>
          <Text className="font-sans text-[13px] leading-5 text-ink-muted">
            Avisos, eventos, cursos e grupos que você tenha criado continuam na
            igreja, mas sem o seu nome — passam a aparecer como “Conta
            removida”. São conteúdo da comunidade, e apagá-los tiraria de todo
            mundo algo que não é só seu.
          </Text>
        </View>

        <View className="gap-3 pt-2">
          <TextField
            label="Digite sua senha para confirmar"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
            autoCapitalize="none"
            placeholder="Sua senha atual"
          />

          {/*
            Segunda confirmação, explícita. Só a senha poderia ser automatismo
            de quem digita senha o dia inteiro; marcar uma caixa que diz
            "permanente" obriga a ler.

            Pressable e não Button: o Button deste projeto recebe `label` e não
            aceita filhos, e aqui é preciso ícone + texto de duas linhas.
          */}
          <Pressable
            onPress={() => setConfirmado((v) => !v)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: confirmado }}
            hitSlop={8}
            className="flex-row items-center gap-3 py-1"
          >
            <Ionicons
              name={confirmado ? 'checkbox' : 'square-outline'}
              size={22}
              color={confirmado ? colors.error : colors.outline}
            />
            <Text className="flex-1 font-sans text-[14px] leading-5 text-ink">
              Entendo que esta ação é permanente e que meus dados serão
              apagados.
            </Text>
          </Pressable>

          {erro ? (
            <Text className="font-sans text-[14px] text-error">{erro}</Text>
          ) : null}

          <Button
            label="Excluir minha conta permanentemente"
            variant="destructive"
            onPress={excluir}
            loading={enviando}
            disabled={!senha || !confirmado || enviando}
          />

          <Button
            label="Cancelar"
            variant="ghost"
            onPress={() => navigation.goBack()}
            disabled={enviando}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
