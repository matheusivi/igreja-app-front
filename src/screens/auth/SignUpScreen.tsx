import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, Chip, TextField } from '../../components';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuth } from '../../navigation/AuthContext';
import type { AuthStackParamList } from '../../navigation/types';
import { extractErrorMessage } from '../../services/api';
import { AuthLayout } from './AuthLayout';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

export function SignUpScreen({ navigation }: Props) {
  const colors = useThemeColors();
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<'Masculino' | 'Feminino' | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const canSubmit =
    fullName.trim().length > 0 &&
    email.trim().length > 0 &&
    gender !== null &&
    hasMinLength &&
    hasUppercase &&
    hasNumber &&
    passwordsMatch &&
    acceptedTerms;

  async function handleSignUp() {
    if (!canSubmit || !gender) return;
    setError(null);
    setIsLoading(true);
    try {
      await signUp({
        nomeCompleto: fullName.trim(),
        email: email.trim(),
        senha: password,
        sexo: gender,
      });
    } catch (e) {
      setError(extractErrorMessage(e, 'Não foi possível criar a conta. Tente novamente.'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Junte-se à nossa comunidade"
      subtitle="Prepare o seu coração para se conectar com a família IBVI Nova Andradina."
      footer={
        <View className="flex-row gap-1">
          <Text className="font-sans text-sm text-ink-muted">Já possui uma conta?</Text>
          <Pressable onPress={() => navigation.navigate('Login')} hitSlop={8}>
            <Text className="font-sans-semibold text-sm text-secondary">Entrar</Text>
          </Pressable>
        </View>
      }
    >
      <TextField
        label="Nome completo"
        placeholder="Ex: João da Silva"
        value={fullName}
        onChangeText={(v) => { setFullName(v); setError(null); }}
      />
      <TextField
        label="E-mail"
        placeholder="seu@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={(v) => { setEmail(v); setError(null); }}
      />

      <View className="gap-1.5">
        <Text className="font-sans-medium text-xs text-ink-muted">Gênero</Text>
        <View className="flex-row gap-2">
          <Chip label="Masculino" active={gender === 'Masculino'} onPress={() => setGender('Masculino')} />
          <Chip label="Feminino" active={gender === 'Feminino'} onPress={() => setGender('Feminino')} />
        </View>
      </View>

      <TextField
        label="Senha"
        secureToggle
        secureTextEntry
        value={password}
        onChangeText={(v) => { setPassword(v); setError(null); }}
      />
      <TextField
        label="Confirmar senha"
        secureToggle
        secureTextEntry
        value={confirmPassword}
        onChangeText={(v) => { setConfirmPassword(v); setError(null); }}
      />

      <Pressable
        className="flex-row items-start gap-2"
        onPress={() => setAcceptedTerms((v) => !v)}
        hitSlop={8}
      >
        <Ionicons
          name={acceptedTerms ? 'checkbox' : 'square-outline'}
          size={20}
          color={acceptedTerms ? colors.gold : colors.outline}
        />
        <Text className="flex-1 font-sans text-sm leading-5 text-ink-muted">
          Concordo com os Termos de Uso e a Política de Privacidade da IBVI Nova Andradina.
        </Text>
      </Pressable>

      {error && (
        <Text className="text-center font-sans text-sm text-error">{error}</Text>
      )}

      <Button
        label="Criar conta"
        loading={isLoading}
        disabled={!canSubmit}
        icon={<Ionicons name="arrow-forward" size={18} color={colors.onGold} />}
        onPress={handleSignUp}
      />
    </AuthLayout>
  );
}
