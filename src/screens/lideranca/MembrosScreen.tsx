import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinhaMembro, TextField, TituloGrupo, TopBar } from '../../components';
import { radius, spacing } from '../../constants/theme';
import {
  useBuscaMembros,
  useDefinirLideranca,
  useLideres,
} from '../../hooks/queries/useBuscaMembros';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuth } from '../../navigation/AuthContext';
import type { AppStackParamList } from '../../navigation/types';
import { extractErrorMessage } from '../../services/api';
import type { UsuarioResumo } from '../../services/users.service';

type Props = NativeStackScreenProps<AppStackParamList, 'Membros'>;

/**
 * Quem é líder na igreja.
 *
 * ═══ A TELA FAZ UMA COISA ═══
 * Antes era um diretório: buscava pessoas, agrupava por família e levava para
 * a tela da família. Virou a ferramenta de delegar liderança — e por isso a
 * família saiu inteira, junto com a navegação para ela.
 *
 * Não é economia de código, é foco. Numa tela onde o toque PROMOVE alguém,
 * uma segunda ação que abre outra coisa é convite a errar: as duas moram na
 * mesma linha, e a diferença entre elas seria só a mira do dedo.
 *
 * ═══ SÓ MEMBRO ↔ LÍDER ═══
 * Pastor e Administrador não se definem por aqui. São as contas que mandam no
 * app, mudam uma vez a cada anos, e uma tela para elas é a porta que um dia
 * vai ser usada errado — no calor de uma discussão, por quem tinha o celular
 * na mão. Definir esses dois exige acesso ao banco, e o trabalho é o ponto.
 *
 * ═══ O QUE ESCONDER NÃO RESOLVE ═══
 * Os botões somem para quem não pode ser alterado, mas isso é arrumação. A
 * regra de verdade está no servidor: a rota aceita só Pastor e Administrador,
 * o schema aceita só Membro e Líder, e o serviço recusa alterar Pastor,
 * Administrador e você mesmo. Tela se contorna chamando a API direto.
 */
export function MembrosScreen({ navigation }: Props) {
  const colors = useThemeColors();
  const { user } = useAuth();
  const [busca, setBusca] = useState('');
  const [emAndamento, setEmAndamento] = useState<number | null>(null);

  const { resultados, buscando, erro, termoCurto, semResultado, minimoCaracteres } =
    useBuscaMembros(busca);

  const { lideres, carregando: carregandoLideres } = useLideres();
  const definir = useDefinirLideranca();

  function confirmar(pessoa: UsuarioResumo) {
    const promover = pessoa.perfil !== 'Líder';
    const perfil = promover ? 'Líder' : 'Membro';

    Alert.alert(
      promover ? 'Tornar líder' : 'Remover a liderança',
      promover
        ? `${pessoa.nomeCompleto} passa a poder criar eventos, avisos, devocionais e salas.`
        : `${pessoa.nomeCompleto} volta a ser membro e perde o acesso às ferramentas de liderança.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: promover ? 'Tornar líder' : 'Remover',
          // Rebaixar TIRA acesso de alguém — merece o vermelho do iOS. Promover
          // é rotina e não destrói nada.
          ...(promover ? {} : { style: 'destructive' as const }),
          onPress: () => {
            setEmAndamento(pessoa.id);
            definir.mutate(
              { usuarioId: pessoa.id, perfil },
              {
                onError: (e) =>
                  Alert.alert(
                    'Não foi possível alterar',
                    extractErrorMessage(e, 'Tente novamente.'),
                  ),
                onSettled: () => setEmAndamento(null),
              },
            );
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <TopBar title="Liderança" onBack={() => navigation.goBack()} />

      <ScrollView
        className="flex-1 bg-background px-gutter"
        contentContainerClassName="gap-lg py-lg"
        keyboardShouldPersistTaps="handled"
      >
        <TextField
          label="Procurar"
          placeholder="Nome da pessoa"
          value={busca}
          onChangeText={setBusca}
          autoCorrect={false}
          returnKeyType="search"
        />

        {erro ? (
          <Text className="font-sans text-[14px] text-error">
            {extractErrorMessage(erro)}
          </Text>
        ) : busca.trim().length === 0 ? (
          /* ═══ SEM BUSCA, A TELA MOSTRA QUEM JÁ É LÍDER ═══
             Antes aqui havia só uma instrução. O resultado é que promover
             alguém e limpar o campo fazia a pessoa sumir — e para rebaixá-la
             depois era preciso LEMBRAR o nome, que é exatamente o que falta
             quando se quer revisar a equipe.

             Duas modalidades, e nunca as duas juntas: com o campo vazio,
             a lista de líderes; digitando, os resultados. Mostrar as duas ao
             mesmo tempo colocaria a mesma pessoa em duas linhas, cada uma com
             o próprio botão de remover. */
          <SecaoLideres
            lideres={lideres}
            carregando={carregandoLideres}
            meuId={user?.id}
            emAndamento={emAndamento}
            onAgir={confirmar}
          />
        ) : termoCurto ? (
          <Text className="font-sans text-[13px] text-ink-muted">
            Digite pelo menos {minimoCaracteres} letras.
          </Text>
        ) : buscando && resultados.length === 0 ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
        ) : semResultado ? (
          <Dica
            icone="account-question-outline"
            titulo="Ninguém encontrado"
            texto="Confira a grafia. A busca ignora acento, mas não adivinha apelido — quem está cadastrado como “José Carlos” não aparece em “Zé”."
          />
        ) : (
          <View>
            <Text className="pb-sm font-sans text-[13px] text-ink-muted">
              {resultados.length}{' '}
              {resultados.length === 1 ? 'pessoa encontrada' : 'pessoas encontradas'}
            </Text>

            {resultados.map((pessoa, i) => (
              <LinhaPessoa
                key={pessoa.id}
                pessoa={pessoa}
                meuId={user?.id}
                emAndamento={emAndamento}
                onAgir={confirmar}
                ultimo={i === resultados.length - 1}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * A lista de quem é líder hoje.
 *
 * É a resposta para "quem são?" e o caminho curto para "tire este". Aparece
 * com o campo de busca vazio, que é o estado em que a tela abre.
 */
function SecaoLideres({
  lideres,
  carregando,
  meuId,
  emAndamento,
  onAgir,
}: {
  lideres: UsuarioResumo[];
  carregando: boolean;
  meuId: number | undefined;
  emAndamento: number | null;
  onAgir: (pessoa: UsuarioResumo) => void;
}) {
  const colors = useThemeColors();

  if (carregando) {
    return <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />;
  }

  if (lideres.length === 0) {
    return (
      <Dica
        icone="shield-account-outline"
        titulo="Nenhum líder ainda"
        texto="Procure a pessoa pelo nome no campo acima para torná-la líder. Quem for líder passa a aparecer nesta lista."
      />
    );
  }

  return (
    <View>
      <TituloGrupo>
        {lideres.length === 1 ? '1 líder' : `${lideres.length} líderes`}
      </TituloGrupo>

      {lideres.map((pessoa, i) => (
        <LinhaPessoa
          key={pessoa.id}
          pessoa={pessoa}
          meuId={meuId}
          emAndamento={emAndamento}
          onAgir={onAgir}
          ultimo={i === lideres.length - 1}
        />
      ))}

      {/* Diz onde estão os que faltam. Sem isto, o pastor que não se vê na
          lista conclui que o app perdeu o cadastro dele. */}
      <Text className="pt-md font-sans text-[13px] leading-5 text-ink-muted">
        Pastores e administradores não aparecem aqui — esses perfis são
        definidos direto no sistema.
      </Text>
    </View>
  );
}

/**
 * Uma pessoa com o botão de papel na ponta, usada nas duas listas.
 *
 * A regra de quem pode ser alterado vive aqui, num lugar só: repetida nas
 * duas listas, ela divergiria na primeira vez que mudasse — e o erro seria
 * silencioso, porque o servidor continuaria recusando certo enquanto a tela
 * oferecesse errado.
 */
function LinhaPessoa({
  pessoa,
  meuId,
  emAndamento,
  onAgir,
  ultimo,
}: {
  pessoa: UsuarioResumo;
  meuId: number | undefined;
  emAndamento: number | null;
  onAgir: (pessoa: UsuarioResumo) => void;
  ultimo: boolean;
}) {
  const ehVoce = pessoa.id === meuId;
  const acima = pessoa.perfil === 'Pastor' || pessoa.perfil === 'Administrador';
  // Nos dois casos o servidor recusaria com 403. Mostrar o botão seria
  // oferecer uma ação que só sabe dar erro.
  const alteravel = !ehVoce && !acima;

  return (
    <LinhaMembro
      usuario={pessoa}
      ultimo={ultimo}
      descricao={
        ehVoce
          ? `Você · ${pessoa.perfil}`
          : acima
            ? `${pessoa.perfil} · definido no sistema`
            : pessoa.perfil
      }
      {...(alteravel
        ? {
            acao: (
              <BotaoPapel
                lider={pessoa.perfil === 'Líder'}
                carregando={emAndamento === pessoa.id}
                onPress={() => onAgir(pessoa)}
              />
            ),
          }
        : {})}
    />
  );
}

/**
 * O botão da ponta da linha.
 *
 * ═══ A COR SEPARA DAR DE TIRAR ═══
 * Os dois são de contorno — numa lista, vários botões preenchidos ao mesmo
 * tempo brigam entre si e a linha vira barra de ferramentas. O que muda é a
 * tinta: rebaixar usa `error`, promover usa a tinta comum.
 *
 * Fossem idênticos, a diferença entre dar e tirar autoridade seria só o
 * texto — e texto é o que menos se lê numa lista de nomes parecidos.
 *
 * Medido: `error` dá 6,95:1 no tema claro e 8,62:1 no escuro, sobre o fundo
 * da tela. É uma das poucas cores desta paleta que serve como tinta; o
 * dourado, por exemplo, não serve (já reprovou três vezes).
 *
 * Nenhuma aparência no `Pressable`: o NativeWind escreve o `className` no
 * mesmo prop `style`, e o que perde o merge deixa de existir. Quem carrega o
 * visual é o `View` de dentro.
 */
function BotaoPapel({
  lider,
  carregando,
  onPress,
}: {
  lider: boolean;
  carregando: boolean;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  const tinta = lider ? colors.error : colors.ink;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={lider ? 'Remover a liderança' : 'Tornar líder'}
      accessibilityState={{ disabled: carregando }}
      disabled={carregando}
      onPress={onPress}
      // O alvo visível tem 36 de altura; o `hitSlop` completa os 44 mínimos
      // sem inchar o botão e empurrar o nome da pessoa.
      hitSlop={{ top: 6, bottom: 6, left: 8, right: 8 }}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : carregando ? 0.5 : 1 })}
    >
      <View
        style={{
          minHeight: 36,
          justifyContent: 'center',
          paddingHorizontal: spacing.md,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: lider ? colors.error : colors.outline,
        }}
      >
        {carregando ? (
          <ActivityIndicator size="small" color={tinta} />
        ) : (
          <Text className="font-sans-semibold text-[13px]" style={{ color: tinta }}>
            {lider ? 'Remover' : 'Tornar líder'}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

function Dica({
  icone,
  titulo,
  texto,
}: {
  icone: keyof typeof MaterialCommunityIcons.glyphMap;
  titulo: string;
  texto: string;
}) {
  const colors = useThemeColors();
  return (
    <View className="items-center gap-md px-lg py-3xl">
      <MaterialCommunityIcons name={icone} size={30} color={colors.inkMuted} />
      <Text className="text-center font-serif-bold text-[17px] text-ink">{titulo}</Text>
      <Text className="max-w-[300px] text-center font-sans text-[14px] leading-6 text-ink-muted">
        {texto}
      </Text>
    </View>
  );
}
