import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Chip } from '../../components';
import { useHistoricoMatriculas } from '../../hooks/queries/useCursos';
import { useMeusGrupos } from '../../hooks/queries/useGrupos';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../navigation/AuthContext';
import type { AppStackParamList } from '../../navigation/types';
import { getCriadorNome } from '../../services/groups.service';

type Tab = 'cursos' | 'familia';

const tabs: { key: Tab; label: string }[] = [
  { key: 'cursos', label: 'Cursos' },
  { key: 'familia', label: 'Família' },
];

export function ProfileScreen() {
  const colors = useThemeColors();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('cursos');
  const { isDark, toggle } = useTheme();

  // Vêm do cache compartilhado: sair de uma turma ou de um grupo em outra
  // tela reflete aqui na hora. Antes isto carregava uma vez só, e o Perfil
  // continuava mostrando turma "em andamento" já cancelada.
  const { data: historico = [], isPending: isLoadingHistorico } = useHistoricoMatriculas();
  const { data: meusGrupos = [], isPending: isLoadingGrupos } = useMeusGrupos(user?.id);

  const activeMatricula = historico.find((m) => m.status === 'ativo');
  const completedMatriculas = historico.filter((m) => m.status === 'concluido');

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView className="flex-1 px-gutter" contentContainerClassName="gap-md py-lg">
        {/* Identidade */}
        <View className="items-center gap-2">
          <Pressable
            onPress={() => navigation.navigate('EditProfile')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Alterar foto de perfil"
          >
            <View className="h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-2 border-gold bg-surface-container-high">
              {user?.fotoUrl ? (
                <Image
                  source={{ uri: user.fotoUrl }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              ) : (
                <Ionicons name="person" size={36} color={colors.primary} />
              )}
            </View>
            <View className="absolute bottom-0 right-0 h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-gold">
              <Ionicons name="camera" size={13} color={colors.onGold} />
            </View>
          </Pressable>
          <Text className="font-serif-bold text-xl text-ink">{user?.nomeCompleto}</Text>
          <View className="flex-row items-center gap-2">
            <Chip label={user?.perfil ?? 'Membro'} tone="success" active />
            {user?.batizado && <Chip label="Batizado" tone="secondary" active />}
          </View>
          {(user?.sexo || user?.profissao) && (
            <View className="flex-row gap-4">
              {user.sexo ? (
                <Text className="font-sans text-xs text-ink-muted">{user.sexo}</Text>
              ) : null}
              {user.profissao ? (
                <Text className="font-sans text-xs text-ink-muted">{user.profissao}</Text>
              ) : null}
            </View>
          )}
        </View>

        {/* Abas */}
        <View className="flex-row rounded-lg bg-surface-container-low p-1">
          {tabs.map((tab) => (
            <Pressable
              key={tab.key}
              className={[
                'flex-1 items-center rounded py-2',
                activeTab === tab.key ? 'bg-gold' : '',
              ].join(' ')}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text
                className={[
                  'font-sans-semibold text-xs',
                  activeTab === tab.key ? 'text-on-gold' : 'text-ink-muted',
                ].join(' ')}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Aba: Cursos */}
        {activeTab === 'cursos' ? (
          isLoadingHistorico ? (
            <ActivityIndicator color={colors.gold} />
          ) : (
            <View className="gap-3">
              {activeMatricula ? (
                <Card contentClassName="gap-2">
                  <Text className="font-sans-semibold text-xs uppercase tracking-wide text-ink-muted">
                    Em andamento
                  </Text>
                  <Text className="font-sans-medium text-sm text-ink">
                    {activeMatricula.nomeCurso}
                  </Text>
                  {activeMatricula.nomeSala ? (
                    <Text className="font-sans text-xs text-outline">
                      Turma: {activeMatricula.nomeSala}
                    </Text>
                  ) : null}
                </Card>
              ) : null}

              {completedMatriculas.length > 0 ? (
                <Card contentClassName="gap-2">
                  <Text className="font-sans-semibold text-xs uppercase tracking-wide text-ink-muted">
                    Cursos concluídos
                  </Text>
                  {completedMatriculas.map((m) => (
                    <View key={m.salaId} className="flex-row items-center gap-2">
                      <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                      <Text className="font-sans text-sm text-ink">{m.nomeCurso}</Text>
                    </View>
                  ))}
                </Card>
              ) : null}

              {!activeMatricula && completedMatriculas.length === 0 ? (
                <Card contentClassName="items-center gap-2 py-6">
                  <Ionicons name="school-outline" size={28} color={colors.outline} />
                  <Text className="text-center font-sans text-sm text-ink-muted">
                    Você ainda não está matriculado em nenhum curso.
                  </Text>
                  <Pressable
                    onPress={() =>
                      navigation.navigate('MainTabs', { screen: 'Ensino' } as never)
                    }
                    hitSlop={8}
                  >
                    <Text className="font-sans-semibold text-sm text-secondary">
                      Ver cursos disponíveis
                    </Text>
                  </Pressable>
                </Card>
              ) : null}
            </View>
          )
        ) : null}

        {/* Aba: Família */}
        {activeTab === 'familia' ? (
          isLoadingGrupos ? (
            <ActivityIndicator color={colors.gold} />
          ) : meusGrupos.length > 0 ? (
            <View className="gap-3">
              {meusGrupos.map((grupo) => {
                const criadorNome = getCriadorNome(grupo);
                return (
                  <Pressable
                    key={grupo.id}
                    onPress={() =>
                      navigation.navigate('GroupDetail', { id: String(grupo.id) })
                    }
                  >
                    <Card contentClassName="flex-row items-center justify-between">
                      {grupo.imagemUrl ? (
                        <Image
                          source={{ uri: grupo.imagemUrl }}
                          className="mr-3 h-14 w-14 rounded-lg"
                          resizeMode="cover"
                        />
                      ) : null}
                      <View className="flex-1">
                        <Text className="font-sans-semibold text-xs uppercase tracking-wide text-ink-muted">
                          Grupo familiar
                        </Text>
                        <Text className="font-serif-bold text-lg text-ink">
                          {grupo.nome ?? 'Grupo familiar'}
                        </Text>
                        {criadorNome ? (
                          <Text className="font-sans text-xs text-ink-muted">
                            Criado por {criadorNome}
                          </Text>
                        ) : null}
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={colors.outline} />
                    </Card>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <Card contentClassName="items-center gap-2 py-6">
              <Ionicons name="people-outline" size={28} color={colors.outline} />
              <Text className="text-center font-sans text-sm text-ink-muted">
                Você ainda não faz parte de nenhum grupo familiar.
              </Text>
              <Text className="text-center font-sans text-xs text-outline">
                Peça pra alguém do grupo te convidar.
              </Text>
            </Card>
          )
        ) : null}

        {/* Acesso rápido */}
        <View className="gap-2">
          <Text className="font-sans-semibold text-xs uppercase tracking-wide text-ink-muted">
            Acesso rápido
          </Text>
          <Card contentClassName="gap-0" padded={false}>
            <Pressable
              className="flex-row items-center justify-between px-4 py-3"
              onPress={() => navigation.navigate('EditProfile')}
            >
              <View className="flex-row items-center gap-3">
                <Ionicons name="settings-outline" size={18} color={colors.secondary} />
                <Text className="font-sans text-sm text-ink">Configurações da conta</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.outline} />
            </Pressable>
            <View className="h-px bg-outline-variant" />
            <Pressable
              className="flex-row items-center justify-between px-4 py-3"
              onPress={toggle}
            >
              <View className="flex-row items-center gap-3">
                <Ionicons
                  name={isDark ? 'moon' : 'moon-outline'}
                  size={18}
                  color={colors.secondary}
                />
                <Text className="font-sans text-sm text-ink">Tema escuro</Text>
              </View>
              <Ionicons
                name={isDark ? 'toggle' : 'toggle-outline'}
                size={26}
                color={isDark ? colors.gold : colors.outline}
              />
            </Pressable>
            <View className="h-px bg-outline-variant" />
            <Pressable
              className="flex-row items-center justify-between px-4 py-3"
              onPress={signOut}
            >
              <View className="flex-row items-center gap-3">
                <Ionicons name="log-out-outline" size={18} color={colors.error} />
                <Text className="font-sans text-sm text-error">Sair da conta</Text>
              </View>
            </Pressable>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
