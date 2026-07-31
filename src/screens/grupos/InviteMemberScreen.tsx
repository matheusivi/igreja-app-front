import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, TextField } from '../../components';
import { useThemeColors } from '../../hooks/useThemeColors';
import type { AppStackParamList } from '../../navigation/types';
import { extractErrorMessage } from '../../services/api';
import { groupsService } from '../../services/groups.service';
import { usersService, type UsuarioResumo } from '../../services/users.service';

type Props = NativeStackScreenProps<AppStackParamList, 'InviteMember'>;

export function InviteMemberScreen({ route, navigation }: Props) {
  const colors = useThemeColors();
  const { grupoId, grupoNome } = route.params;

  const [busca, setBusca] = useState('');
  const [resultados, setResultados] = useState<UsuarioResumo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [selecionado, setSelecionado] = useState<UsuarioResumo | null>(null);
  const [parentesco, setParentesco] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSearch() {
    if (!busca.trim()) return;
    setIsSearching(true);
    setSearchError(null);
    try {
      const data = await usersService.search(busca.trim());
      setResultados(data);
    } catch (e) {
      setSearchError(extractErrorMessage(e));
    } finally {
      setIsSearching(false);
    }
  }

  function handleSelect(usuario: UsuarioResumo) {
    setSelecionado(usuario);
    setInviteError(null);
    setSuccess(false);
  }

  async function handleInvite() {
    if (!selecionado) return;
    setInviteError(null);
    setIsInviting(true);
    try {
      await groupsService.inviteMember(grupoId, selecionado.id, parentesco.trim() || undefined);
      setSuccess(true);
      setSelecionado(null);
      setParentesco('');
    } catch (e) {
      setInviteError(extractErrorMessage(e));
    } finally {
      setIsInviting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center justify-between border-b border-outline-variant px-gutter py-3">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </Pressable>
        <Text className="font-serif-bold text-base text-primary">Convidar Membro</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        className="flex-1 px-gutter"
        contentContainerClassName="gap-4 py-lg"
        keyboardShouldPersistTaps="handled"
      >
        <Text className="font-sans text-sm text-ink-muted">
          Convidando para {grupoNome || 'o grupo'}
        </Text>

        <View className="flex-row items-end gap-2">
          <View className="flex-1">
            <TextField
              label="Buscar por nome"
              placeholder="Ex: Maria"
              value={busca}
              onChangeText={setBusca}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>
          <Button label="Buscar" fullWidth={false} loading={isSearching} onPress={handleSearch} />
        </View>

        {searchError && (
          <Text className="text-center font-sans text-sm text-error">{searchError}</Text>
        )}

        {success && (
          <Text className="text-center font-sans text-sm text-success">
            Convite enviado com sucesso!
          </Text>
        )}

        {resultados.length > 0 ? (
          <View className="gap-2">
            {resultados.map((usuario) => (
              <Pressable key={usuario.id} onPress={() => handleSelect(usuario)}>
                <Card contentClassName="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <View className="h-11 w-11 items-center justify-center rounded-full bg-surface-container-high">
                      <Text className="font-sans-semibold text-ink">
                        {usuario.nomeCompleto.trim().charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text className="font-sans-semibold text-sm text-ink">
                        {usuario.nomeCompleto}
                      </Text>
                      <Text className="font-sans text-xs text-ink-muted">{usuario.perfil}</Text>
                    </View>
                  </View>
                  {selecionado?.id === usuario.id ? (
                    <Ionicons name="checkmark-circle" size={20} color={colors.gold} />
                  ) : null}
                </Card>
              </Pressable>
            ))}
          </View>
        ) : !isSearching && busca.trim() ? (
          <Text className="py-2 text-center font-sans text-sm text-ink-muted">
            Nenhum membro encontrado.
          </Text>
        ) : null}

        {selecionado ? (
          <View className="gap-4">
            <TextField
              label="Parentesco (opcional)"
              placeholder="Ex: Filho, Cônjuge"
              value={parentesco}
              onChangeText={setParentesco}
            />

            {inviteError && (
              <Text className="text-center font-sans text-sm text-error">{inviteError}</Text>
            )}

            <Button label="Enviar convite" loading={isInviting} onPress={handleInvite} />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
