import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Chip } from '../../components';
import { useHistoricoMatriculas } from '../../hooks/queries/useCursos';
import { useMeusGrupos } from '../../hooks/queries/useGrupos';
import {
  useBloqueados,
  useDenunciasPendentes,
} from '../../hooks/queries/useModeracao';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../navigation/AuthContext';
import type { AppStackParamList } from '../../navigation/types';
import { API_BASE_URL } from '../../config';
import { NOME_IGREJA, PAGINAS } from '../../constants/igreja';
import { getCriadorNome } from '../../services/groups.service';
import { urlImagem } from '../../services/imagem';
import { rotuloProfissao } from '../../services/profissoes';
import { EspacoTabBar } from '../../navigation/TabBar';

type Tab = 'cursos' | 'familia';

const tabs: { key: Tab; label: string }[] = [
  { key: 'cursos', label: 'Cursos' },
  { key: 'familia', label: 'Família' },
];

export function ProfileScreen() {
  const colors = useThemeColors();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { user, signOut } = useAuth();

  const ehLideranca = ['Líder', 'Pastor', 'Administrador'].includes(
    user?.perfil ?? '',
  );

  /**
   * Duas contagens que decidem se certas entradas do menu existem.
   *
   * A de bloqueados é compartilhada com a tela de bloqueados pelo cache do
   * TanStack Query — uma requisição serve às duas. A de denúncias só dispara
   * para quem tem cargo; membro comum não gasta uma ida à rede para receber
   * 403.
   */
  const { quantidade: quantidadeBloqueados } = useBloqueados();
  const { total: denunciasPendentes } = useDenunciasPendentes(ehLideranca);

  /**
   * ═══ DE ONDE VEIO O CÓDIGO QUE ESTÁ RODANDO ═══
   * `isEmbeddedLaunch` é verdadeiro quando o app roda o pacote que veio dentro
   * do APK, e falso quando roda uma atualização baixada pelo ar.
   *
   * É a informação que faltou hoje: sem ela não havia como distinguir "a
   * atualização não chegou" de "a atualização chegou e tem um defeito". São
   * dois problemas opostos que se parecem por fora.
   *
   * Os 8 primeiros caracteres do id bastam para identificar qual atualização
   * é, e cabem na linha.
   */
  const versaoApp = Constants.expoConfig?.version ?? '?';
  const origemDoCodigo = Updates.isEmbeddedLaunch
    ? 'instalado'
    : `atualização ${Updates.updateId?.slice(0, 8) ?? 'desconhecida'}`;

  /**
   * Só o domínio, sem `https://` nem caminho. É o suficiente para saber se o
   * app está falando com o servidor certo, e não vira uma linha comprida
   * atravessando a tela.
   */
  const servidorVisivel = API_BASE_URL.replace(/^https?:\/\//, '');

  /** A cara da igreja é decisão de quem responde por ela. Líder fica fora. */
  /**
   * As duas entradas de pastorado: a cara do app e quem é líder.
   *
   * Mesma condição, uma constante só — quando um terceiro item aparecer, ele
   * herda a regra em vez de reescrevê-la com uma vírgula fora do lugar.
   *
   * Líder fica de fora dos dois de propósito. Da aparência, porque o topo da
   * Home é a cara da igreja, não a de um ministério. Da liderança, porque
   * quem recebeu autoridade não distribui autoridade.
   */
  const ehPastorado = ['Pastor', 'Administrador'].includes(user?.perfil ?? '');

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
      <ScrollView className="flex-1 px-gutter" contentContainerClassName="gap-xl py-3xl">
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
                  source={{ uri: urlImagem(user.fotoUrl, { largura: 80, altura: 80 }) }}
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
                <Text className="font-sans text-xs text-ink-muted">
                  {rotuloProfissao(user.profissao)}
                </Text>
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
                    <Text className="font-sans text-xs text-ink-muted">
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
                          source={{ uri: urlImagem(grupo.imagemUrl, { largura: 56, altura: 56 }) }}
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
              <Text className="text-center font-sans text-xs text-ink-muted">
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
            {/* ═══ ABERTO A TODO MEMBRO ═══
                A igreja conhecendo o trabalho da própria gente. Fica aqui
                porque serve a todos — não é ferramenta de liderança.

                A busca de pessoas e famílias, que morava logo abaixo, saiu:
                ela virou o campo no topo da aba Grupos, onde digitar o nome
                de alguém traz a casa dessa pessoa. Duas portas para a mesma
                pergunta faziam a segunda parecer outra coisa. */}
            <Pressable
              className="flex-row items-center justify-between px-4 py-3"
              accessibilityRole="button"
              onPress={() => navigation.navigate('Profissionais')}
            >
              <View className="flex-row items-center gap-3">
                <Ionicons name="briefcase-outline" size={18} color={colors.secondary} />
                <Text className="font-sans text-sm text-ink">Trabalhos da comunidade</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.outline} />
            </Pressable>
            <View className="h-px bg-outline-variant" />

            {/* ═══ SÓ PASTOR E ADMINISTRADOR ═══
                A capa e a frase do topo são a primeira coisa que todo membro
                vê ao abrir o app — é a cara da igreja, não a de um
                ministério, então Líder fica de fora.

                Esconder a entrada não é a segurança: quem recusa é o serviço,
                com 403. Aqui é arrumação. */}
            {ehPastorado ? (
              <>
                <Pressable
                  className="flex-row items-center justify-between px-4 py-3"
                  accessibilityRole="button"
                  onPress={() => navigation.navigate('AparenciaHome')}
                >
                  <View className="flex-row items-center gap-3">
                    <Ionicons name="image-outline" size={18} color={colors.secondary} />
                    <Text className="font-sans text-sm text-ink">
                      Aparência da tela inicial
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.outline} />
                </Pressable>
                <View className="h-px bg-outline-variant" />

                {/* "Liderança da igreja", e não "Membros": o nome antigo
                    descrevia o que a tela LISTAVA. Numa lista de opções, o
                    rótulo precisa dizer o que a tela FAZ — senão o pastor
                    procura onde promover alguém e passa direto por ela. */}
                <Pressable
                  className="flex-row items-center justify-between px-4 py-3"
                  accessibilityRole="button"
                  onPress={() => navigation.navigate('Membros')}
                >
                  <View className="flex-row items-center gap-3">
                    <Ionicons
                      name="shield-checkmark-outline"
                      size={18}
                      color={colors.secondary}
                    />
                    <Text className="font-sans text-sm text-ink">
                      Liderança da igreja
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.outline} />
                </Pressable>
                <View className="h-px bg-outline-variant" />
              </>
            ) : null}

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
            {/*
              ═══ APARECE SÓ PARA QUEM JÁ BLOQUEOU ALGUÉM ═══
              Numa igreja, uma linha permanente escrita "Pessoas bloqueadas"
              sugere conflito onde não há. Quem nunca bloqueou ninguém — que
              vai ser quase todo mundo — não precisa ver essa palavra toda vez
              que abre o perfil.

              A exigência das lojas é que bloquear seja REVERSÍVEL e que o
              caminho exista. Ele existe: aparece no instante em que passa a
              fazer sentido, e o aviso mostrado ao bloquear já diz onde
              encontrá-lo.
            */}
            {quantidadeBloqueados > 0 ? (
              <>
                <View className="h-px bg-outline-variant" />
                <Pressable
                  className="flex-row items-center justify-between px-4 py-3"
                  onPress={() => navigation.navigate('Bloqueados')}
                >
                  <View className="flex-row items-center gap-3">
                    <Ionicons name="eye-off-outline" size={18} color={colors.secondary} />
                    <Text className="font-sans text-sm text-ink">
                      Pessoas bloqueadas
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Text className="font-sans text-sm text-ink-muted">
                      {quantidadeBloqueados}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.outline} />
                  </View>
                </Pressable>
              </>
            ) : null}

            {/*
              A fila de denúncias. Só liderança, e o número em vermelho porque
              a Apple exige resposta em 24 horas — um contador discreto não
              comunicaria a urgência.
            */}
            {ehLideranca ? (
              <>
                <View className="h-px bg-outline-variant" />
                <Pressable
                  className="flex-row items-center justify-between px-4 py-3"
                  onPress={() => navigation.navigate('Denuncias')}
                >
                  <View className="flex-row items-center gap-3">
                    <Ionicons name="flag-outline" size={18} color={colors.secondary} />
                    <Text className="font-sans text-sm text-ink">Denúncias</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    {denunciasPendentes > 0 ? (
                      <Text className="font-sans-semibold text-sm text-error">
                        {denunciasPendentes}
                      </Text>
                    ) : null}
                    <Ionicons name="chevron-forward" size={16} color={colors.outline} />
                  </View>
                </Pressable>
              </>
            ) : null}

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

          {/*
            ═══ EXCLUIR A CONTA FICA FORA DO CARTÃO, E POR ÚLTIMO ═══
            Separado do resto de propósito. Dentro da mesma lista, ficaria
            encostado em "Sair da conta" — duas ações de saída lado a lado, uma
            reversível e a outra não. Quem quer sair e toca um item abaixo
            apagaria tudo.

            Sem ícone e em texto menor: precisa ser encontrável por quem
            procura, e invisível para quem não está procurando. As lojas exigem
            que exista e que dê para achar; não exigem que compita por atenção.
          */}
          {/*
            Os documentos ficam aqui para quem JÁ tem conta poder reler. Na
            tela de cadastro eles aparecem antes de aceitar; depois disso, o
            Perfil é o único lugar onde a pessoa pensaria em procurar.
          */}
          <View className="flex-row items-center justify-center gap-2 pt-4">
            <Pressable onPress={() => void Linking.openURL(PAGINAS.privacidade)} hitSlop={8}>
              <Text className="font-sans text-[13px] text-ink-muted underline">
                Privacidade
              </Text>
            </Pressable>
            <Text className="font-sans text-[13px] text-ink-muted">·</Text>
            <Pressable onPress={() => void Linking.openURL(PAGINAS.termos)} hitSlop={8}>
              <Text className="font-sans text-[13px] text-ink-muted underline">
                Termos de Uso
              </Text>
            </Pressable>
          </View>

          <Pressable
            className="items-center py-3"
            onPress={() => navigation.navigate('ExcluirConta')}
            hitSlop={8}
          >
            <Text className="font-sans text-[13px] text-ink-muted underline">
              Excluir minha conta
            </Text>
          </Pressable>

          {/*
            ═══ A LINHA DE VERSÃO ═══
            Nasceu de uma dor concreta: o app parou de falar com o servidor e
            passamos horas sem conseguir responder duas perguntas básicas —
            "qual endereço ele está chamando?" e "esta é a versão nova ou a
            antiga?". Sem isso, todo diagnóstico virava adivinhação.

            Vale para sempre, não só agora. Quando um membro disser "não está
            funcionando", esta linha responde o que ele não saberia explicar.
            É o mesmo motivo pelo qual todo app sério tem um "Sobre".

            Discreta de propósito: quem não procura não vê.
          */}
          <View className="items-center pb-2">
            <Text className="font-sans text-[11px] text-ink-muted">
              {NOME_IGREJA} · v{versaoApp} · {origemDoCodigo}
            </Text>
            <Text className="font-sans text-[11px] text-ink-muted">
              {servidorVisivel}
            </Text>
          </View>
        </View>
        {/* A barra de abas flutua sobre o conteúdo, fora do fluxo do layout.
            Sem este espaço, o último item da lista fica permanentemente
            escondido atrás dela. */}
        <EspacoTabBar />
      </ScrollView>
    </SafeAreaView>
  );
}
