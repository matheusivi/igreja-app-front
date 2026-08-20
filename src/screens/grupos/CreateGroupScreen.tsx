import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ImagePickerField, TextField } from '../../components';
import { useCriarGrupo } from '../../hooks/queries/useGrupos';
import { useThemeColors } from '../../hooks/useThemeColors';
import type { AppStackParamList } from '../../navigation/types';
import { extractErrorMessage } from '../../services/api';

type Props = NativeStackScreenProps<AppStackParamList, 'CreateGroup'>;

export function CreateGroupScreen({ navigation }: Props) {
  const colors = useThemeColors();
  const [nome, setNome] = useState('');
  const [imagemUrl, setImagemUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Pelo hook, e não pelo service direto — era exatamente isso que faltava.
  // Sem passar pela mutação, criar o grupo não invalidava nada, e a aba
  // Grupos só mostrava o grupo novo quando remontava por outro motivo.
  const criarGrupo = useCriarGrupo();

  function handleSubmit() {
    setError(null);
    criarGrupo.mutate(
      { nome: nome.trim() || undefined, imagemUrl },
      {
        onSuccess: (grupo) =>
          navigation.replace('GroupDetail', { id: String(grupo.id) }),
        onError: (e) =>
          setError(extractErrorMessage(e, 'Não foi possível criar a família.')),
      },
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center justify-between border-b border-outline-variant px-gutter py-3">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </Pressable>
        <Text className="font-serif-bold text-base text-primary">Criar grupo Familiar</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        className="flex-1 px-gutter"
        contentContainerClassName="gap-4 py-3xl"
        keyboardShouldPersistTaps="handled"
      >
        <TextField
          label="Nome do família (opcional)"
          placeholder="Ex: Família Silva"
          value={nome}
          onChangeText={(v) => { setNome(v); setError(null); }}
        />

        <ImagePickerField
          label="Fotofamília (opcional)"
          pasta="familias"
          value={imagemUrl}
          onChange={(url) => { setImagemUrl(url); setError(null); }}
          hint="Uma foto da família ajuda a identificar o família na lista."
        />

        {error && <Text className="text-center font-sans text-sm text-error">{error}</Text>}

        <Button
          label="Criar Família"
          loading={criarGrupo.isPending}
          onPress={handleSubmit}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
