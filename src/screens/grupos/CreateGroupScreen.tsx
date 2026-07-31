import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ImagePickerField, TextField } from '../../components';
import { useThemeColors } from '../../hooks/useThemeColors';
import type { AppStackParamList } from '../../navigation/types';
import { extractErrorMessage } from '../../services/api';
import { groupsService } from '../../services/groups.service';

type Props = NativeStackScreenProps<AppStackParamList, 'CreateGroup'>;

export function CreateGroupScreen({ navigation }: Props) {
  const colors = useThemeColors();
  const [nome, setNome] = useState('');
  const [imagemUrl, setImagemUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setIsLoading(true);
    try {
      const grupo = await groupsService.createGroup(
        nome.trim() || undefined,
        imagemUrl,
      );
      navigation.replace('GroupDetail', { id: String(grupo.id) });
    } catch (e) {
      setError(extractErrorMessage(e, 'Não foi possível criar a família.'));
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
        <Text className="font-serif-bold text-base text-primary">Criar grupo Familiar</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        className="flex-1 px-gutter"
        contentContainerClassName="gap-4 py-lg"
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

        <Button label="Criar Família" loading={isLoading} onPress={handleSubmit} />
      </ScrollView>
    </SafeAreaView>
  );
}
