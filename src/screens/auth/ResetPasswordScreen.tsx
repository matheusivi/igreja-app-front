import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  Button,
  ItemRequisito,
  RequisitosSenha,
  avaliarSenha,
  senhaValida,
  TextField,
} from '../../components';
import { useThemeColors } from '../../hooks/useThemeColors';
import { NOME_IGREJA } from '../../constants/igreja';
import type { AuthStackParamList } from '../../navigation/types';
import { authService } from '../../services/auth.service';
import { extractErrorMessage } from '../../services/api';
import { AuthLayout } from './AuthLayout';

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

/**
 * Tira TODO espaço do código, não só das pontas.
 *
 * O código tem 64 caracteres e o e-mail o quebra em várias linhas. Ao
 * selecionar e copiar, o celular traz as quebras junto — e `trim()` só limpa
 * início e fim. O resultado era "código inválido" para quem copiou certo.
 */
function limparCodigo(valor: string): string {
  return valor.replace(/\s+/g, '');
}

export function ResetPasswordScreen({ navigation, route }: Props) {
  const colors = useThemeColors();
  const [token, setToken] = useState(route.params?.token ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const forcaSenha = avaliarSenha(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const canSubmit = limparCodigo(token).length > 0 && senhaValida(forcaSenha) && passwordsMatch;

  async function handleReset() {
    if (!canSubmit) return;
    setError(null);
    setIsLoading(true);
    try {
      await authService.resetPassword(limparCodigo(token), password);
      setDone(true);
    } catch (e) {
      setError(extractErrorMessage(e, 'Código inválido ou expirado. Solicite um novo link.'));
    } finally {
      setIsLoading(false);
    }
  }

  if (done) {
    return (
      <AuthLayout
        title="Senha redefinida!"
        subtitle="Sua senha foi atualizada com sucesso. Faça login para continuar."
        footer={<Text className="font-sans text-xs text-ink-muted">{NOME_IGREJA}</Text>}
      >
        <Button
          label="Ir para o login"
          icon={<Ionicons name="arrow-forward" size={18} color={colors.onGold} />}
          onPress={() => navigation.navigate('Login')}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Redefinir senha"
      subtitle="Insira o código recebido por e-mail e escolha uma nova senha segura."
      footer={
        <Pressable
          className="flex-row items-center gap-1"
          onPress={() => navigation.navigate('Login')}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={16} color={colors.secondary} />
          <Text className="font-sans-semibold text-sm text-secondary">Voltar para o login</Text>
        </Pressable>
      }
    >
      <TextField
        label="Código de recuperação"
        placeholder="Cole aqui o código que chegou no e-mail"
        autoCapitalize="none"
        value={token}
        onChangeText={(v) => { setToken(v); setError(null); }}
      />
      <TextField
        label="Nova senha"
        secureToggle
        secureTextEntry
        value={password}
        onChangeText={(v) => { setPassword(v); setError(null); }}
      />
      <TextField
        label="Confirmar nova senha"
        secureToggle
        secureTextEntry
        value={confirmPassword}
        onChangeText={(v) => { setConfirmPassword(v); setError(null); }}
      />

      <View className="gap-2 rounded bg-surface-container-low p-3">
        <Text className="font-sans-semibold text-xs uppercase tracking-wide text-ink-muted">
          Requisitos de segurança
        </Text>
        <RequisitosSenha senha={password} />
        <ItemRequisito ok={passwordsMatch} rotulo="As senhas devem ser iguais" />
      </View>

      {error && (
        <Text className="text-center font-sans text-sm text-error">{error}</Text>
      )}

      <Button
        label="Redefinir senha"
        loading={isLoading}
        disabled={!canSubmit}
        icon={<Ionicons name="arrow-forward" size={18} color={colors.onGold} />}
        onPress={handleReset}
      />
    </AuthLayout>
  );
}
