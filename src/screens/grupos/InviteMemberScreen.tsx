import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, LinhaMembro, SeletorPapel, TextField, TopBar } from '../../components';
import { radius, spacing } from '../../constants/theme';
import { useBuscaMembros } from '../../hooks/queries/useBuscaMembros';
import { useThemeColors } from '../../hooks/useThemeColors';
import type { AppStackParamList } from '../../navigation/types';
import { extractErrorMessage } from '../../services/api';
import { groupsService, type PapelFamilia } from '../../services/groups.service';
import type { UsuarioResumo } from '../../services/users.service';

type Props = NativeStackScreenProps<AppStackParamList, 'InviteMember'>;

/**
 * Convidar alguém para a família.
 *
 * ═══ A FAMÍLIA APARECE ANTES DA ESCOLHA ═══
 * O servidor recusa (409) convidar quem já pertence a uma família — cada
 * pessoa pertence a uma por vez. Antes, essa regra só se manifestava DEPOIS:
 * o líder digitava, apertava "buscar", escolhia alguém, preenchia o
 * parentesco, mandava, e só então levava o erro.
 *
 * Regra que só existe no momento do envio transforma a tela num campo minado.
 * Agora cada resultado mostra de que família a pessoa é, e quem já tem uma
 * nem é selecionável — com o motivo escrito na própria linha. Item
 * desabilitado sem explicação faz a pessoa tocar de novo mais forte, achando
 * que o app travou.
 *
 * ═══ O BOTÃO "BUSCAR" SAIU ═══
 * Ninguém digita "Maria" e depois PENSA se quer buscar. O botão existia para
 * economizar requisição e cobrava um toque a mais toda vez. Foi substituído
 * por debounce — ver `useBuscaMembros`.
 */
export function InviteMemberScreen({ route, navigation }: Props) {
  const colors = useThemeColors();
  const { grupoId, grupoNome } = route.params;

  const [busca, setBusca] = useState('');
  const {
    resultados,
    buscando,
    erro,
    termoCurto,
    semResultado,
    minimoCaracteres,
  } = useBuscaMembros(busca);

  const [selecionado, setSelecionado] = useState<UsuarioResumo | null>(null);
  const [parentesco, setParentesco] = useState<PapelFamilia | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erroConvite, setErroConvite] = useState<string | null>(null);
  const [enviadoPara, setEnviadoPara] = useState<string | null>(null);

  async function convidar() {
    if (!selecionado) return;
    setErroConvite(null);
    setEnviando(true);
    try {
      await groupsService.inviteMember(
        grupoId,
        selecionado.id,
        parentesco ?? undefined,
      );
      // Guarda o nome antes de limpar: a confirmação precisa dizer PARA QUEM
      // o convite foi, senão quem convida três pessoas seguidas perde a conta.
      setEnviadoPara(selecionado.nomeCompleto);
      setSelecionado(null);
      setParentesco(null);
      setBusca('');
    } catch (e) {
      setErroConvite(extractErrorMessage(e));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <TopBar title="Convidar para a família" onBack={() => navigation.goBack()} />

      <ScrollView
        className="flex-1 bg-background px-gutter"
        contentContainerClassName="gap-lg py-lg"
        keyboardShouldPersistTaps="handled"
      >
        <Text className="font-sans text-[14px] leading-6 text-ink-muted">
          Convidando para{' '}
          <Text className="font-sans-semibold text-ink">{grupoNome || 'o grupo'}</Text>. Cada
          pessoa pertence a uma família por vez.
        </Text>

        <TextField
          label="Procurar pessoa"
          placeholder="Nome ou família — ex: Maria, Souza"
          value={busca}
          onChangeText={(v) => {
            setBusca(v);
            setErroConvite(null);
            setEnviadoPara(null);
          }}
          autoCorrect={false}
          returnKeyType="search"
        />

        {enviadoPara ? (
          <View
            className="flex-row items-center gap-sm"
            style={{
              padding: spacing.md,
              borderRadius: radius.md,
              backgroundColor: colors.successSoft,
            }}
          >
            <MaterialCommunityIcons name="check-circle" size={17} color={colors.success} />
            <Text className="flex-1 font-sans text-[14px] text-ink">
              Convite enviado para {enviadoPara}.
            </Text>
          </View>
        ) : null}

        {/* ── Resultados ─────────────────────────────────────────── */}
        {erro ? (
          <Text className="font-sans text-[14px] text-error">{extractErrorMessage(erro)}</Text>
        ) : termoCurto ? (
          <Text className="font-sans text-[13px] text-ink-muted">
            Digite pelo menos {minimoCaracteres} letras.
          </Text>
        ) : buscando && resultados.length === 0 ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
        ) : semResultado ? (
          <Text className="font-sans text-[14px] text-ink-muted">
            Ninguém encontrado com esse nome. Confira a grafia — a busca ignora acento, mas
            não adivinha apelido.
          </Text>
        ) : resultados.length > 0 ? (
          <View>
            {resultados.map((usuario, i) => (
              <LinhaMembro
                key={usuario.id}
                usuario={usuario}
                selecionado={selecionado?.id === usuario.id}
                // O motivo fica na linha. A alternativa — deixar tocável e
                // devolver o 409 — gasta uma requisição para dizer o que já
                // estava na tela.
                bloqueio={
                  usuario.familiaId
                    ? `Já faz parte de ${usuario.familia ?? 'outra família'}`
                    : null
                }
                onPress={() => {
                  setSelecionado(usuario);
                  setErroConvite(null);
                  setEnviadoPara(null);
                }}
                ultimo={i === resultados.length - 1}
              />
            ))}
          </View>
        ) : null}

        {/* ── Parentesco e envio ─────────────────────────────────── */}
        {selecionado ? (
          <View
            style={{
              gap: spacing.md,
              padding: spacing.lg,
              borderRadius: radius.lg,
              backgroundColor: colors.surfaceDim,
            }}
          >
            <Text className="font-sans-semibold text-[14px] text-ink">
              Papel de {selecionado.nomeCompleto.split(' ')[0]} na família
            </Text>
            <SeletorPapel
              valor={parentesco}
              onChange={setParentesco}
              sexo={selecionado.sexo}
            />
            <Text className="font-sans text-[13px] leading-5 text-ink-muted">
              Aparece no convite e fica registrado na família. Dá para definir ou
              corrigir depois, na tela da família.
            </Text>

            {erroConvite ? (
              <Text className="font-sans text-[13px] text-error">{erroConvite}</Text>
            ) : null}

            <Button
              label={`Convidar ${selecionado.nomeCompleto.split(' ')[0]}`}
              loading={enviando}
              icon={
                <MaterialCommunityIcons
                  name="email-heart-outline"
                  size={17}
                  color={colors.onPrimary}
                />
              }
              onPress={convidar}
            />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
