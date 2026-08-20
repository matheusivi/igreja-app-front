import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Button,
  EditorBlocos,
  TextField,
  TopBar,
  novoBloco,
  paraPayload,
  paraRascunho,
  type BlocoRascunho,
} from '../../components';
import { tracking } from '../../constants/theme';
import { useThemeColors } from '../../hooks/useThemeColors';
import type { AppStackParamList } from '../../navigation/types';
import { extractErrorMessage } from '../../services/api';
import { isValidDate, maskDate } from '../../utils/masks';
import {
  useAtualizarConteudo,
  useConteudo,
  useCriarConteudo,
} from '../../hooks/queries/useConteudos';
import type { Conteudo, CreateConteudoPayload } from '../../services/content.service';

/**
 * Publicar devocional ou aviso.
 *
 * ═══ O TIPO DECIDE A TELA ═══
 * Devocional e aviso são coisas diferentes, e a escolha vinha primeiro como
 * duas pílulas pequenas de 12px — o mesmo peso de qualquer outro campo. Só
 * que ela muda o que os OUTROS campos significam: aviso tem validade,
 * devocional não; aviso é lido de relance, devocional é lido inteiro.
 *
 * Agora são dois cartões com nome e explicação, no topo, ocupando a largura.
 * O tamanho corresponde à consequência da escolha.
 *
 * ═══ SEÇÕES NUMERADAS ═══
 * Mesma estrutura do formulário de evento, pela mesma razão: campos
 * empilhados no mesmo peso não têm começo nem fim aparente. Aqui são três:
 * o que é, o conteúdo, e como publicar.
 *
 * ═══ A AJUDA VIVE JUNTO DO CAMPO ═══
 * O aviso "a primeira imagem vira a capa" estava solto embaixo do editor com
 * um `marginTop: -8` para colar — gambiarra que denuncia que o texto está no
 * lugar errado. Ele agora é a explicação da seção, dita ANTES de a pessoa
 * montar o conteúdo, que é quando a informação ainda é útil.
 */

type Props = NativeStackScreenProps<AppStackParamList, 'CreateConteudo'>;

/**
 * Só os dois tipos que o app realmente exibe.
 *
 * "Estudo", "Material" e "Apresentacao" continuam existindo no banco, mas não
 * têm tela — publicar um deles criava conteúdo que ninguém veria.
 */
const TIPOS: {
  valor: Conteudo['tipo'];
  titulo: string;
  descricao: string;
  icone: keyof typeof MaterialCommunityIcons.glyphMap;
}[] = [
  {
    valor: 'Devocional',
    titulo: 'Devocional',
    descricao: 'Uma palavra para a igreja meditar. Fica no app sem prazo.',
    icone: 'book-open-page-variant-outline',
  },
  {
    valor: 'Aviso',
    titulo: 'Aviso',
    descricao: 'Comunicado rápido. Pode sair sozinho numa data.',
    icone: 'bullhorn-outline',
  },
];

export function CreateConteudoScreen({ route, navigation }: Props) {
  const colors = useThemeColors();
  const editId = route.params?.id;
  const isEditing = !!editId;
  const defaultTipo = route.params?.tipo ?? 'Devocional';

  const [tipo, setTipo] = useState<Conteudo['tipo']>(defaultTipo);
  const [titulo, setTitulo] = useState('');
  const [blocos, setBlocos] = useState<BlocoRascunho[]>(() =>
    // Começa com um parágrafo em branco: escrever é a ação mais provável, e
    // uma tela totalmente vazia não sugere por onde começar.
    isEditing ? [] : [novoBloco('texto')],
  );
  const [principal, setPrincipal] = useState(false);
  const [validade, setValidade] = useState('');
  const [error, setError] = useState<string | null>(null);

  const {
    data: conteudoExistente,
    isPending: isLoadingConteudo,
    error: erroCarregar,
  } = useConteudo(editId);

  const erroExibido = error ?? (erroCarregar ? extractErrorMessage(erroCarregar) : null);

  const criarConteudo = useCriarConteudo();
  const atualizarConteudo = useAtualizarConteudo();
  const isLoading = criarConteudo.isPending || atualizarConteudo.isPending;

  // Preenche o formulário quando o conteúdo chega do cache. `useEffect` aqui
  // é o uso legítimo: sincronizar estado de formulário com dado externo.
  useEffect(() => {
    if (!conteudoExistente) return;
    setTipo(conteudoExistente.tipo);
    setTitulo(conteudoExistente.titulo);
    setBlocos(paraRascunho(conteudoExistente.blocos ?? []));
    setPrincipal(conteudoExistente.principal);
    setValidade(
      conteudoExistente.dataValidade
        ? new Date(conteudoExistente.dataValidade).toLocaleDateString('pt-BR')
        : '',
    );
  }, [conteudoExistente]);

  const ehAviso = tipo === 'Aviso';
  const blocosPreenchidos = paraPayload(blocos);

  /** Diz o QUE falta, em vez de só desabilitar o botão em silêncio. */
  function faltando(): string | null {
    if (!titulo.trim()) return 'Informe o título.';
    if (blocosPreenchidos.length === 0)
      return 'Escreva ao menos um parágrafo, ou adicione uma imagem.';
    return null;
  }

  function handleSubmit() {
    if (isLoading) return;
    setError(null);

    let validadeISO: string | null = null;
    if (ehAviso && validade.trim()) {
      if (!isValidDate(validade)) {
        setError('Data de validade inválida. Use DD/MM/AAAA.');
        return;
      }
      const [d, m, y] = validade.trim().split('/');
      // Fim do dia: o aviso continua no ar durante toda a data escolhida.
      validadeISO = `${y}-${m}-${d}T23:59:59.999Z`;
    }

    const payload: CreateConteudoPayload = {
      tipo,
      titulo: titulo.trim(),
      principal,
      // A sequência inteira vai junto: no servidor ela substitui a anterior.
      blocos: blocosPreenchidos,
      // Enviado sempre para o aviso, inclusive `null` — é assim que se remove
      // uma validade e o aviso volta a ser permanente.
      ...(ehAviso ? { dataValidade: validadeISO } : {}),
    };

    const onError = (e: unknown) =>
      setError(
        extractErrorMessage(
          e,
          isEditing
            ? 'Não foi possível salvar as alterações.'
            : 'Não foi possível publicar.',
        ),
      );

    const onSuccess = () => navigation.goBack();

    if (isEditing) {
      atualizarConteudo.mutate({ id: Number(editId), payload }, { onSuccess, onError });
    } else {
      criarConteudo.mutate(payload, { onSuccess, onError });
    }
  }

  if (isEditing && isLoadingConteudo) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const pendencia = faltando();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <TopBar
        title={isEditing ? 'Editar publicação' : 'Nova publicação'}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        className="flex-1 bg-background px-gutter"
        contentContainerClassName="gap-2xl py-xl"
        keyboardShouldPersistTaps="handled"
      >
        {/* ═══ 1. O QUE É ═══════════════════════════════════════════ */}
        <Secao numero={1} titulo="O que você vai publicar">
          {/* Dois cartões, não duas pílulas: a escolha muda o significado dos
              outros campos, então ela merece o espaço da consequência. */}
          <View className="gap-md">
            {TIPOS.map((t) => {
              const ativo = tipo === t.valor;
              return (
                <Pressable
                  key={t.valor}
                  accessibilityRole="button"
                  accessibilityState={{ selected: ativo }}
                  accessibilityLabel={`${t.titulo}. ${t.descricao}`}
                  onPress={() => setTipo(t.valor)}
                  style={({ pressed }) => pressed && { opacity: 0.75 }}
                  className={[
                    'flex-row items-start gap-md rounded-lg border p-lg',
                    ativo
                      ? 'border-primary bg-secondary-soft'
                      : 'border-outline-variant bg-surface-bright',
                  ].join(' ')}
                >
                  <MaterialCommunityIcons
                    name={t.icone}
                    size={22}
                    color={ativo ? colors.primary : colors.inkMuted}
                  />
                  <View className="flex-1">
                    <Text
                      className={[
                        'font-sans-semibold text-[15px]',
                        ativo ? 'text-on-secondary-soft' : 'text-ink',
                      ].join(' ')}
                    >
                      {t.titulo}
                    </Text>
                    <Text
                      className={[
                        'mt-0.5 font-sans text-[13px] leading-5',
                        ativo ? 'text-on-secondary-soft' : 'text-ink-muted',
                      ].join(' ')}
                    >
                      {t.descricao}
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name={ativo ? 'radiobox-marked' : 'radiobox-blank'}
                    size={20}
                    color={ativo ? colors.primary : colors.outline}
                  />
                </Pressable>
              );
            })}
          </View>

          <TextField
            label="Título *"
            placeholder={
              ehAviso ? 'Ex: Ensaio do coral antecipado' : 'Ex: A fé que move montanhas'
            }
            value={titulo}
            onChangeText={(v) => {
              setTitulo(v);
              setError(null);
            }}
          />
        </Secao>

        {/* ═══ 2. O CONTEÚDO ════════════════════════════════════════ */}
        <Secao
          numero={2}
          titulo="O conteúdo"
          ajuda={
            ehAviso
              ? 'Escreva o comunicado e, se quiser, acrescente uma imagem. A primeira imagem vira a capa na lista.'
              : 'Escreva parágrafo a parágrafo. Dá para intercalar imagens e vídeos do YouTube — a primeira imagem vira a capa e abre a leitura.'
          }
        >
          <EditorBlocos
            blocos={blocos}
            onChange={(b) => {
              setBlocos(b);
              setError(null);
            }}
          />
        </Secao>

        {/* ═══ 3. PUBLICAÇÃO ════════════════════════════════════════ */}
        <Secao numero={3} titulo="Publicação">
          {/* Validade só faz sentido em aviso: "culto especial dia 15" deve
              sair sozinho do mural, um devocional não vence. */}
          {ehAviso ? (
            <View className="gap-sm">
              <TextField
                label="Válido até"
                placeholder="DD/MM/AAAA"
                value={validade}
                onChangeText={(v) => {
                  setValidade(maskDate(v));
                  setError(null);
                }}
                keyboardType="numeric"
                maxLength={10}
              />
              <Text className="font-sans text-[13px] leading-5 text-ink-muted">
                Depois desta data o aviso sai da tela inicial sozinho. Em branco, ele fica
                até você excluir.
              </Text>
            </View>
          ) : null}

          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: principal }}
            accessibilityLabel="Marcar como destaque"
            onPress={() => setPrincipal((v) => !v)}
            style={({ pressed }) => pressed && { opacity: 0.75 }}
            className={[
              'flex-row items-start gap-md rounded-lg border p-lg',
              principal
                ? 'border-gold bg-gold-fixed'
                : 'border-outline-variant bg-surface-bright',
            ].join(' ')}
          >
            <MaterialCommunityIcons
              name={principal ? 'star' : 'star-outline'}
              size={22}
              color={principal ? colors.onGoldFixed : colors.inkMuted}
            />
            <View className="flex-1">
              <Text
                className={[
                  'font-sans-semibold text-[15px]',
                  principal ? 'text-on-gold-fixed' : 'text-ink',
                ].join(' ')}
              >
                Marcar como destaque
              </Text>
              {/* ═══ O PRAZO PRECISA ESTAR ESCRITO AQUI ═══
                  O destaque expira sozinho no servidor — 21 dias, ou a data
                  de validade quando é aviso. Isso resolve o destaque
                  esquecido, mas comportamento automático que a pessoa não
                  esperava é indistinguível de defeito: ela marcaria, voltaria
                  em um mês e concluiria que "o destaque não funciona".

                  Dizer o prazo na hora de escolher transforma a mesma
                  mecânica em promessa cumprida. */}
              <Text
                className={[
                  'mt-0.5 font-sans text-[13px] leading-5',
                  principal ? 'text-on-gold-fixed' : 'text-ink-muted',
                ].join(' ')}
              >
                Vai para o topo da lista e da tela inicial, com o selo dourado. Só um{' '}
                {tipo.toLowerCase()} fica em destaque por vez — marcar este tira o
                anterior.
                {ehAviso
                  ? ' O destaque dura enquanto o aviso valer.'
                  : ' O destaque sai sozinho depois de 21 dias.'}
              </Text>
            </View>
          </Pressable>
        </Secao>

        {/* ═══ Publicar ═════════════════════════════════════════════ */}
        <View className="gap-md">
          {erroExibido ? (
            <View className="flex-row items-start gap-sm rounded-md bg-surface-dim px-lg py-md">
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={17}
                color={colors.error}
                style={{ marginTop: 1 }}
              />
              <Text className="flex-1 font-sans text-[13px] leading-5 text-error">
                {erroExibido}
              </Text>
            </View>
          ) : pendencia ? (
            <View className="flex-row items-center gap-sm">
              <MaterialCommunityIcons
                name="information-outline"
                size={16}
                color={colors.inkMuted}
              />
              <Text className="flex-1 font-sans text-[13px] text-ink-muted">
                {pendencia}
              </Text>
            </View>
          ) : null}

          <Button
            label={
              isEditing ? 'Salvar alterações' : `Publicar ${tipo.toLowerCase()}`
            }
            loading={isLoading}
            disabled={pendencia !== null}
            icon={
              <MaterialCommunityIcons
                name="send-outline"
                size={18}
                color={colors.onPrimary}
              />
            }
            onPress={handleSubmit}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ────────────────────────────────────────────────────────────────────── */

/** Mesmo bloco do formulário de evento — dois formulários, uma gramática. */
function Secao({
  numero,
  titulo,
  ajuda,
  children,
}: {
  numero: number;
  titulo: string;
  ajuda?: string;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-lg">
      <View className="gap-sm">
        <View className="flex-row items-center gap-md">
          <View className="h-6 w-6 items-center justify-center rounded-full bg-surface-dim">
            <Text className="font-sans-semibold text-[12px] text-ink-muted">{numero}</Text>
          </View>
          <Text
            className="flex-1 font-serif-bold text-lg text-ink"
            style={{ letterSpacing: tracking.heading }}
          >
            {titulo}
          </Text>
        </View>

        {/* A ajuda vem ANTES do campo, que é quando ela ainda muda o que a
            pessoa vai fazer. Depois do campo, vira justificativa. */}
        {ajuda ? (
          <Text className="font-sans text-[13px] leading-5 text-ink-muted">{ajuda}</Text>
        ) : null}
      </View>

      <View className="gap-lg">{children}</View>
    </View>
  );
}
