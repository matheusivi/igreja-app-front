import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Chip, TextField } from '../../components';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useSeletorImagem } from '../../hooks/useSeletorImagem';
import { aniversariantesKeys } from '../../hooks/queries/useAniversariantes';
import { useAuth } from '../../navigation/AuthContext';
import type { AppStackParamList } from '../../navigation/types';
import { extractErrorMessage } from '../../services/api';
import type { UpdateMePayload } from '../../services/auth.service';
import { getIniciais } from '../../services/prayer.service';
import { isValidDate, maskDate } from '../../utils/masks';

type Props = NativeStackScreenProps<AppStackParamList, 'EditProfile'>;

function isoToDisplayDate(iso: string | null): string {
  if (!iso) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return '';
  const [, y, m, d] = match;
  return `${d}/${m}/${y}`;
}

function displayDateToISO(display: string): string | null {
  // Valida de verdade (rejeita 31/02, mês 13...) antes de converter.
  if (!isValidDate(display)) return null;
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(display.trim());
  if (!match) return null;
  const [, d, m, y] = match;
  return `${y}-${m}-${d}`;
}

export function EditProfileScreen({ navigation }: Props) {
  const colors = useThemeColors();
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();

  const [nomeCompleto, setNomeCompleto] = useState(user?.nomeCompleto ?? '');
  const [sexo, setSexo] = useState<'Masculino' | 'Feminino' | null>(user?.sexo ?? null);
  const [dataNascimento, setDataNascimento] = useState(
    isoToDisplayDate(user?.dataNascimento ?? null),
  );
  const [estadoCivil, setEstadoCivil] = useState(user?.estadoCivil ?? '');
  const [profissao, setProfissao] = useState(user?.profissao ?? '');
  const [exibirAniversario, setExibirAniversario] = useState(user?.exibirAniversario ?? true);
  const [fotoUrl, setFotoUrl] = useState<string | null>(user?.fotoUrl ?? null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A foto só é gravada no perfil quando a pessoa salva o formulário — igual
  // aos outros campos. Assim dá pra trocar a imagem e desistir sem efeito.
  const { abrir: abrirSeletorFoto, isEnviando: isEnviandoFoto } = useSeletorImagem({
    pasta: 'perfis',
    quadrado: true,
    onEnviada: setFotoUrl,
    onRemovida: () => setFotoUrl(null),
  });

  function canSubmit(): boolean {
    if (!nomeCompleto.trim()) return false;
    if (dataNascimento.trim() && !displayDateToISO(dataNascimento)) return false;
    return true;
  }

  async function handleSubmit() {
    setError(null);
    if (!nomeCompleto.trim()) {
      setError('Informe o nome completo.');
      return;
    }
    let dataNascimentoISO: string | undefined;
    if (dataNascimento.trim()) {
      const iso = displayDateToISO(dataNascimento);
      if (!iso) {
        setError('Data de nascimento inválida. Use DD/MM/AAAA.');
        return;
      }
      dataNascimentoISO = iso;
    }

    setIsLoading(true);
    try {
      const payload: UpdateMePayload = {
        nomeCompleto: nomeCompleto.trim(),
        ...(sexo ? { sexo } : {}),
        ...(dataNascimentoISO ? { dataNascimento: dataNascimentoISO } : {}),
        // Enviados mesmo vazios: é assim que a pessoa consegue APAGAR um dado
        // que preencheu antes. Antes o campo em branco simplesmente não ia,
        // e o valor antigo ficava lá para sempre.
        estadoCivil: estadoCivil.trim(),
        profissao: profissao.trim(),
        exibirAniversario,
        // Só vai se mudou. Mandar sempre faria o backend achar que houve troca
        // e tentar apagar a imagem atual no Cloudinary a cada salvamento.
        ...(fotoUrl !== (user?.fotoUrl ?? null) ? { fotoUrl } : {}),
      };
      await updateUser(payload);

      // A lista de aniversariantes da Home tem cache de 10 minutos. Sem
      // invalidar aqui, mudar a data de nascimento (ou desligar a exibição)
      // não refletia na Home — parecia que não tinha salvado.
      await queryClient.invalidateQueries({
        queryKey: aniversariantesKeys.all,
        refetchType: 'all',
      });

      Alert.alert('Perfil atualizado', 'Suas informações foram salvas.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      setError(extractErrorMessage(e, 'Não foi possível salvar as alterações.'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center justify-between border-b border-outline-variant px-gutter py-3">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </Pressable>
        <Text className="font-serif-bold text-base text-primary">Configurações da conta</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        className="flex-1 px-gutter"
        contentContainerClassName="gap-4 py-lg"
        keyboardShouldPersistTaps="handled"
      >
        {/* Foto de perfil */}
        <View className="items-center gap-2">
          <Pressable
            onPress={abrirSeletorFoto}
            disabled={isEnviandoFoto}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Alterar foto de perfil"
          >
            <View className="h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-gold bg-surface-container-high">
              {isEnviandoFoto ? (
                <ActivityIndicator color={colors.gold} />
              ) : fotoUrl ? (
                <Image
                  source={{ uri: fotoUrl }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              ) : (
                <Text className="font-serif-bold text-2xl text-primary">
                  {getIniciais(nomeCompleto || user?.nomeCompleto)}
                </Text>
              )}
            </View>
            {/* Selo de câmera: sem ele não há nada indicando que o avatar
                é tocável — foi exatamente a dúvida que surgiu no uso real. */}
            <View className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-gold">
              <Ionicons name="camera" size={15} color={colors.onGold} />
            </View>
          </Pressable>
          <Text className="font-sans text-xs text-ink-muted">
            {isEnviandoFoto ? 'Enviando foto…' : 'Toque para alterar a foto'}
          </Text>
        </View>

        <TextField
          label="Nome completo *"
          placeholder="Ex: João da Silva"
          value={nomeCompleto}
          onChangeText={(v) => { setNomeCompleto(v); setError(null); }}
        />

        <View className="gap-1.5">
          <Text className="font-sans-medium text-xs text-ink-muted">Sexo</Text>
          <View className="flex-row gap-2">
            <Chip
              label="Masculino"
              active={sexo === 'Masculino'}
              onPress={() => setSexo('Masculino')}
            />
            <Chip
              label="Feminino"
              active={sexo === 'Feminino'}
              onPress={() => setSexo('Feminino')}
            />
          </View>
        </View>

        <TextField
          label="Data de nascimento"
          placeholder="DD/MM/AAAA"
          value={dataNascimento}
          onChangeText={(v) => { setDataNascimento(maskDate(v)); setError(null); }}
          keyboardType="numeric"
          maxLength={10}
        />

        <TextField
          label="Estado civil"
          placeholder="Ex: Casado(a)"
          value={estadoCivil}
          onChangeText={setEstadoCivil}
        />

        <TextField
          label="Profissão"
          placeholder="Ex: Professor(a)"
          value={profissao}
          onChangeText={setProfissao}
        />

        <Pressable
          className="flex-row items-center gap-3 rounded-lg border border-outline-variant bg-surface-container-low p-3"
          onPress={() => setExibirAniversario((v) => !v)}
        >
          <View className="flex-1">
            <Text className="font-sans-medium text-sm text-ink">
              Exibir aniversário para a igreja
            </Text>
            <Text className="font-sans text-xs leading-4 text-ink-muted">
              {exibirAniversario
                ? 'Seu nome aparece na lista de aniversariantes da tela inicial.'
                : 'Seu nome NÃO aparece na lista de aniversariantes da tela inicial.'}
            </Text>
          </View>
          <Ionicons
            name={exibirAniversario ? 'toggle' : 'toggle-outline'}
            size={26}
            color={exibirAniversario ? colors.gold : colors.outline}
          />
        </Pressable>

        {error && <Text className="text-center font-sans text-sm text-error">{error}</Text>}

        <Button
          label="Salvar alterações"
          loading={isLoading}
          disabled={!canSubmit()}
          onPress={handleSubmit}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
