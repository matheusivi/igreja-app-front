import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, TextField } from '../../components';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuth } from '../../navigation/AuthContext';
import type { AuthStackParamList } from '../../navigation/types';
import { extractErrorMessage } from '../../services/api';
import { authService } from '../../services/auth.service';
import { AuthLayout } from './AuthLayout';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const colors = useThemeColors();
  const { signIn, sessionExpired, clearSessionExpired } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pré-preenche o e-mail se o usuário marcou "Lembrar de mim" da última vez.
  useEffect(() => {
    authService.getRememberedEmail().then((saved) => {
      if (saved) {
        setEmail(saved);
        setRememberMe(true);
      }
    });
  }, []);

  async function handleSignIn() {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) return;
    setError(null);
    setIsLoading(true);
    try {
      await signIn(trimmedEmail, password);
      // Só persiste depois do login dar certo — evita guardar e-mail digitado errado.
      await authService.setRememberedEmail(rememberMe ? trimmedEmail : null);
    } catch (e) {
      setError(extractErrorMessage(e, 'E-mail ou senha incorretos.'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="IBVI Nova Andradina"
      title="Bem-vindo de volta"
      subtitle="Acesse sua conta para continuar sua caminhada de fé com a comunidade."
      footer={
        <View className="flex-row gap-1">
          <Text className="font-sans text-sm text-ink-muted">Não possui uma conta?</Text>
          <Pressable onPress={() => navigation.navigate('SignUp')} hitSlop={8}>
            <Text className="font-sans-semibold text-sm text-secondary">Cadastre-se</Text>
          </Pressable>
        </View>
      }
    >
      {sessionExpired ? (
        <View className="flex-row items-start gap-2 rounded bg-gold-fixed p-3">
          <Ionicons name="time-outline" size={16} color={colors.onGold} />
          <Text className="flex-1 font-sans text-sm leading-5 text-on-gold">
            Sua sessão expirou. Entre novamente para continuar.
          </Text>
        </View>
      ) : null}

      <TextField
        label="E-mail"
        placeholder="seu@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={(v) => { setEmail(v); setError(null); clearSessionExpired(); }}
      />
      <TextField
        label="Senha"
        placeholder="••••••••"
        secureToggle
        secureTextEntry
        value={password}
        onChangeText={(v) => { setPassword(v); setError(null); }}
      />

      <View className="flex-row items-center justify-between">
        <Pressable
          className="flex-row items-center gap-2"
          onPress={() => setRememberMe((v) => !v)}
          hitSlop={8}
        >
          <Ionicons
            name={rememberMe ? 'checkbox' : 'square-outline'}
            size={20}
            color={rememberMe ? colors.gold : colors.outline}
          />
          <Text className="font-sans text-sm text-ink-muted">Lembrar de mim</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('ForgotPassword')} hitSlop={8}>
          <Text className="font-sans-semibold text-sm text-secondary">Esqueceu a senha?</Text>
        </Pressable>
      </View>

      {error && (
        <Text className="text-center font-sans text-sm text-error">{error}</Text>
      )}

      <Button
        label="Entrar"
        loading={isLoading}
        disabled={!email.trim() || !password}
        icon={<Ionicons name="arrow-forward" size={18} color={colors.onGold} />}
        onPress={handleSignIn}
      />
    </AuthLayout>
  );
}
