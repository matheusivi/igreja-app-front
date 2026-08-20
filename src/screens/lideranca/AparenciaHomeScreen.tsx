import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, HeroInicio, TextField, TituloGrupo, TopBar } from '../../components';
import { radius, spacing } from '../../constants/theme';
import {
  useConfiguracao,
  useSalvarConfiguracao,
} from '../../hooks/queries/useConfiguracao';
import { useSeletorImagem } from '../../hooks/useSeletorImagem';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuth } from '../../navigation/AuthContext';
import type { AppStackParamList } from '../../navigation/types';
import { extractErrorMessage } from '../../services/api';

type Props = NativeStackScreenProps<AppStackParamList, 'AparenciaHome'>;

const LIMITE_VERSICULO = 180;

/**
 * A capa e a frase do topo da Home.
 *
 * ═══ POR QUE ESTA TELA EXISTE ═══
 * Os dois estavam no CÓDIGO: a frase escrita no `HomeScreen`, a capa como um
 * `require` de arquivo em `assets/`. Trocar qualquer um exigia editar o fonte
 * e publicar versão nova do app — e nenhum pastor faz deploy. Na prática, a
 * cara da igreja era imutável.
 *
 * ═══ A PRÉ-VISUALIZAÇÃO É O HERO DE VERDADE ═══
 * O que aparece aqui em cima é o mesmo `HeroInicio` que a Home usa, com os
 * valores que estão sendo editados. Não é uma miniatura aproximada: é o
 * componente, com o véu, a saudação e a tipografia reais.
 *
 * Isso importa porque a decisão que se toma aqui é "esta foto fica boa com
 * texto branco por cima?". Uma prévia que não mostra o véu responderia a
 * pergunta errada — e a pessoa só descobriria o problema depois de salvar,
 * abrindo a Home.
 */
export function AparenciaHomeScreen({ navigation }: Props) {
  const colors = useThemeColors();
  const { user } = useAuth();
  const { data: configuracao, isPending } = useConfiguracao();
  const salvar = useSalvarConfiguracao();

  // `undefined` = ainda não mexeu neste campo; usa o que veio do servidor.
  const [imagem, setImagem] = useState<string | null | undefined>(undefined);
  const [versiculo, setVersiculo] = useState<string | undefined>(undefined);
  const [erro, setErro] = useState<string | null>(null);

  const imagemAtual = imagem !== undefined ? imagem : (configuracao?.heroImagemUrl ?? null);
  const versiculoAtual =
    versiculo !== undefined ? versiculo : (configuracao?.versiculoHome ?? '');

  const { abrir: escolherFoto, isEnviando } = useSeletorImagem({
    pasta: 'hero',
    // A capa é uma faixa larga, não um quadrado: recortar em 1:1 aqui faria a
    // pessoa enquadrar uma coisa e ver outra na Home.
    quadrado: false,
    onEnviada: (url) => {
      setImagem(url);
      setErro(null);
    },
    ...(imagemAtual ? { onRemovida: () => setImagem(null) } : {}),
  });

  const mudou =
    imagem !== undefined ||
    (versiculo !== undefined && versiculo !== (configuracao?.versiculoHome ?? ''));

  function gravar() {
    setErro(null);
    salvar.mutate(
      {
        // Só o que a pessoa realmente mexeu. Mandar os dois sempre faria o
        // servidor achar que a capa mudou e apagar a imagem atual do
        // Cloudinary só porque a frase foi editada.
        ...(imagem !== undefined ? { heroImagemUrl: imagem } : {}),
        ...(versiculo !== undefined
          ? { versiculoHome: versiculo.trim() || null }
          : {}),
      },
      {
        onSuccess: () => {
          setImagem(undefined);
          setVersiculo(undefined);
          Alert.alert('Tela inicial atualizada', 'Todos os membros já veem a mudança.', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
        },
        onError: (e) => setErro(extractErrorMessage(e, 'Não foi possível salvar.')),
      },
    );
  }

  if (isPending) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <TopBar title="Aparência da tela inicial" onBack={() => navigation.goBack()} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <TopBar title="Aparência da tela inicial" onBack={() => navigation.goBack()} />

      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="pb-3xl"
        keyboardShouldPersistTaps="handled"
      >
        {/* ── O hero de verdade, com os valores em edição ─────────── */}
        <HeroInicio
          nomeCompleto={user?.nomeCompleto}
          versiculo={versiculoAtual || 'A expectativa gera o ambiente de milagres.'}
          imagem={imagemAtual}
        />

        <View className="gap-lg px-gutter pt-lg">
          <Text className="font-sans text-[13px] leading-5 text-ink-muted">
            É assim que a tela inicial aparece para todos os membros. As mudanças só
            valem depois de salvar.
          </Text>

          {/* ── Capa ─────────────────────────────────────────────── */}
          <View className="gap-sm">
            <TituloGrupo>Foto de fundo</TituloGrupo>

            <Text className="font-sans text-[13px] leading-5 text-ink-muted">
              Use uma foto na horizontal — do templo, de um culto, da congregação
              reunida. Ela recebe um escurecimento automático para o texto continuar
              legível, então imagens claras funcionam bem.
            </Text>

            <View className="flex-row gap-sm">
              <View className="flex-1">
                <Button
                  label={imagemAtual ? 'Trocar foto' : 'Escolher foto'}
                  variant={imagemAtual ? 'outline' : 'primary'}
                  loading={isEnviando}
                  icon={
                    <MaterialCommunityIcons
                      name="image-outline"
                      size={18}
                      color={imagemAtual ? colors.ink : colors.onPrimary}
                    />
                  }
                  onPress={escolherFoto}
                />
              </View>

              {imagemAtual ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Remover a foto de fundo"
                  onPress={() => setImagem(null)}
                  disabled={isEnviando}
                  style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                >
                  <View
                    style={{
                      minHeight: 52,
                      justifyContent: 'center',
                      paddingHorizontal: spacing.lg,
                      borderRadius: radius.button,
                      borderWidth: 1,
                      borderColor: colors.outlineVariant,
                    }}
                  >
                    <Text className="font-sans-semibold text-[15px] text-error">
                      Remover
                    </Text>
                  </View>
                </Pressable>
              ) : null}
            </View>

            {/* Sem foto NÃO é erro: é o estado normal de quem ainda não subiu
                uma, e o hero tem um layout próprio para ele. Dizer isso evita
                que a pessoa procure um problema que não existe. */}
            {!imagemAtual ? (
              <Text className="font-sans text-[13px] leading-5 text-ink-muted">
                Sem foto, a tela inicial mostra o emblema da igreja sobre o fundo
                marrom — que é como está hoje.
              </Text>
            ) : null}
          </View>

          {/* ── Frase ────────────────────────────────────────────── */}
          <View className="gap-sm">
            <TituloGrupo>Frase do topo</TituloGrupo>

            <TextField
              label="Versículo ou frase"
              placeholder="A expectativa gera o ambiente de milagres."
              value={versiculoAtual}
              onChangeText={(v) => {
                setVersiculo(v);
                setErro(null);
              }}
              multiline
              numberOfLines={3}
              maxLength={LIMITE_VERSICULO}
            />

            <Text className="font-sans text-[13px] text-ink-muted">
              {versiculoAtual.length}/{LIMITE_VERSICULO} caracteres. Em branco, volta
              para a frase padrão.
            </Text>
          </View>

          {erro ? (
            <Text className="font-sans text-[13px] text-error">{erro}</Text>
          ) : null}

          <Button
            label="Salvar"
            loading={salvar.isPending}
            // Sem mudança não há o que salvar — botão ativo que não faz nada
            // ensina que o app às vezes ignora o toque.
            disabled={!mudou || isEnviando}
            onPress={gravar}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
