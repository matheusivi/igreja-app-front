import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, TextField } from '../../components';
import { useThemeColors } from '../../hooks/useThemeColors';
import type { AuthStackParamList } from '../../navigation/types';
import { authService } from '../../services/auth.service';
import { extractErrorMessage } from '../../services/api';
import { AuthLayout } from './AuthLayout';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: Props) {
  const colors = useThemeColors();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSend() {
    if (!email.trim()) return;
    setError(null);
    setIsLoading(true);
    try {
      await authService.forgotPassword(email.trim());
      setSent(true);
    } catch (e) {
      setError(extractErrorMessage(e, 'Não foi possível enviar o e-mail. Verifique o endereço informado.'));
    } finally {
      setIsLoading(false);
    }
  }

  if (sent) {
    return (
      <AuthLayout
        title="Verifique seu e-mail"
        subtitle={`Enviamos um código de 8 dígitos para ${email}. Ele vale por 15 minutos.`}
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
        <Button
          label="Inserir código e redefinir senha"
          icon={<Ionicons name="arrow-forward" size={18} color={colors.onGold} />}
          // O e-mail viaja junto: a pessoa acabou de digitá-lo, e pedir de
          // novo na tela seguinte seria trabalho sem motivo.
          onPress={() =>
            navigation.navigate('ResetPassword', { email: email.trim() })
          }
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Esqueceu a senha?"
      subtitle="Insira seu e-mail abaixo e enviaremos instruções para você criar uma nova senha."
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
        label="Endereço de e-mail"
        placeholder="seuemail@exemplo.com"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={(v) => { setEmail(v); setError(null); }}
      />

      {error && (
        <Text className="text-center font-sans text-sm text-error">{error}</Text>
      )}

      <Button
        label="Enviar link de recuperação"
        loading={isLoading}
        disabled={!email.trim()}
        icon={<Ionicons name="arrow-forward" size={18} color={colors.onGold} />}
        onPress={handleSend}
      />
    </AuthLayout>
  );
}
