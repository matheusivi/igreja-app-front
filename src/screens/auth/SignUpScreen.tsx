import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, Chip, RequisitosSenha, avaliarSenha, senhaValida, TextField } from '../../components';
import { useThemeColors } from '../../hooks/useThemeColors';
import { NOME_IGREJA } from '../../constants/igreja';
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

  // A mesma avaliação que a lista de requisitos desenha. Recalcular à mão
  // aqui seria a porta para o botão discordar do que a tela mostra.
  const forcaSenha = avaliarSenha(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const canSubmit =
    fullName.trim().length > 0 &&
    email.trim().length > 0 &&
    gender !== null &&
    senhaValida(forcaSenha) &&
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
      subtitle={`Prepare o seu coração para se conectar com a ${NOME_IGREJA}.`}
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
      {/* ═══ AS REGRAS APARECEM ANTES DO ERRO ═══
          O botão de criar conta já dependia destas três condições, mas em
          silêncio: quem digitava uma senha curta via o botão apagado e nada
          explicando o motivo. Foi onde a primeira pessoa a testar o app
          travou.

          A lista acende conforme cada regra é cumprida. Custa três linhas e
          troca "adivinhe o que eu quero" por "faltam duas". */}
      <RequisitosSenha senha={password} />

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
          {`Concordo com os Termos de Uso e a Política de Privacidade da ${NOME_IGREJA}.`}
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
