import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Chip, SeletorProfissao, TextField } from '../../components';
import { tracking } from '../../constants/theme';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useSeletorImagem } from '../../hooks/useSeletorImagem';
import { useAuth } from '../../navigation/AuthContext';
import type { AppStackParamList } from '../../navigation/types';
import { extractErrorMessage } from '../../services/api';
import { urlImagem } from '../../services/imagem';
import type { UpdateMePayload } from '../../services/auth.service';
import { getIniciais } from '../../services/prayer.service';
import { isValidDate, maskDate, maskPhone, somenteDigitos } from '../../utils/masks';

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
  const [profissao, setProfissao] = useState<string | null>(user?.profissao ?? null);
  const [exibirAniversario, setExibirAniversario] = useState(user?.exibirAniversario ?? true);
  // Mascarado na tela, só dígitos no servidor — ver `maskPhone`.
  const [telefone, setTelefone] = useState(maskPhone(user?.telefone ?? ''));
  const [especializacao, setEspecializacao] = useState(user?.especializacao ?? '');
  const [divulgarTrabalho, setDivulgarTrabalho] = useState(
    user?.divulgarTrabalho ?? false,
  );
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
        profissao,
        exibirAniversario,
        // `null` quando em branco: é o que APAGA o telefone. String vazia
        // passaria pela validação de dígitos e gravaria "" — um telefone que
        // existe e não serve para nada.
        telefone: somenteDigitos(telefone) || null,
        especializacao: especializacao.trim(),
        divulgarTrabalho,
        // Só vai se mudou. Mandar sempre faria o backend achar que houve troca
        // e tentar apagar a imagem atual no Cloudinary a cada salvamento.
        ...(fotoUrl !== (user?.fotoUrl ?? null) ? { fotoUrl } : {}),
      };
      await updateUser(payload);

      /**
       * Invalidação ampla, de propósito.
       *
       * O nome e a foto da pessoa não vivem só no `user` do AuthContext: eles
       * vêm EMBUTIDOS na resposta de várias outras listas — `autor` no pedido
       * de oração, `criador` no grupo familiar, `lider` na turma,
       * `participantes` na sala, `aniversariantes` na Home. Cada uma dessas
       * respostas está guardada no cache com a foto que existia na hora em que
       * foi buscada.
       *
       * Antes só `aniversariantes` era invalidado. Por isso trocar a foto de
       * perfil mudava o avatar no Perfil e na Home, mas o mural de oração
       * continuava mostrando a foto antiga: aquele cache nunca era avisado.
       *
       * Sem `refetchType`, o padrão é `'active'` — só as telas montadas
       * recarregam agora; as demais ficam marcadas como velhas e buscam de
       * novo quando a pessoa entrar nelas. Salvar o perfil é uma ação rara, e
       * este é o único ponto do app em que um dado se espalha por tantas
       * listas ao mesmo tempo.
       */
      await queryClient.invalidateQueries();

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
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <View className="flex-row items-center justify-between border-b border-outline-variant px-gutter py-3">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </Pressable>
        <Text className="font-serif-bold text-base text-primary">Configurações da conta</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        className="flex-1 px-gutter"
        contentContainerClassName="gap-4 py-3xl"
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
                  source={{ uri: urlImagem(fotoUrl, { largura: 96, altura: 96 }) }}
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

        {/* Lista fechada, não texto livre: "Pedreiro", "pedreiro" e
            "Pedreiro autônomo" eram três profissões diferentes para o
            diretório, e quem procurava um pedreiro achava uma delas. */}
        <SeletorProfissao valor={profissao} onChange={setProfissao} />

        {/* ═══ DIZER QUE ESCOLHER A PROFISSÃO NÃO PUBLICA NADA ═══
            No primeiro teste com gente de verdade, a pessoa escolheu a
            profissão e foi embora achando que já apareceria em "Trabalhos da
            comunidade". Não aparece: entrar lá é opt-in, e o interruptor fica
            uns dois toques de rolagem abaixo daqui.

            O silêncio aqui produzia o pior resultado possível — a pessoa
            achando que se ofereceu, e ninguém a encontrando. */}
        <Text className="font-sans text-[13px] leading-5 text-ink-muted">
          Escolher a profissão não publica nada. Para aparecer em "Trabalhos da
          comunidade" e ser encontrado por quem precisa, ative a opção mais
          abaixo nesta tela.
        </Text>

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

        {/* ═══ DIVULGAR O TRABALHO ═══════════════════════════════════
            Bloco próprio, com título, e não mais três campos soltos no meio
            do formulário. Estes campos só existem por causa de UMA decisão —
            aparecer ou não no diretório — e agrupá-los é o que deixa isso
            claro antes de a pessoa preencher qualquer coisa. */}
        <View className="gap-md pt-lg">
          <View className="gap-xs">
            <Text
              className="font-serif-bold text-lg text-ink"
              style={{ letterSpacing: tracking.heading }}
            >
              Divulgar meu trabalho
            </Text>
            <Text className="font-sans text-[13px] leading-5 text-ink-muted">
              A igreja tem pedreiro, costureira, professora, eletricista e quase
              ninguém sabe. Aqui você aparece para quem precisa do que você faz.
            </Text>
          </View>

          <TextField
            label="Telefone"
            placeholder="(67) 99999-1234"
            value={telefone}
            onChangeText={(v) => setTelefone(maskPhone(v))}
            keyboardType="phone-pad"
            maxLength={15}
          />

          <TextField
            label="Especialidade"
            placeholder="Ex: reformas, acabamento e pequenos reparos"
            value={especializacao}
            onChangeText={setEspecializacao}
            multiline
            numberOfLines={2}
          />

          <Pressable
            className="flex-row items-center gap-3 rounded-lg border border-outline-variant bg-surface-container-low p-3"
            accessibilityRole="switch"
            accessibilityState={{ checked: divulgarTrabalho }}
            onPress={() => setDivulgarTrabalho((v) => !v)}
          >
            <View className="flex-1">
              <Text className="font-sans-medium text-sm text-ink">
                Aparecer em "Trabalhos da comunidade"
              </Text>
              {/* Diz exatamente O QUE é publicado e PARA QUEM. Um interruptor
                  que só diz "divulgar meu trabalho" pede consentimento sem
                  informar — e consentimento sem informação não é escolha. */}
              <Text className="font-sans text-xs leading-4 text-ink-muted">
                {divulgarTrabalho
                  ? 'Seu nome, foto, profissão, especialidade e um botão de WhatsApp ficam visíveis para os membros da igreja. Você pode desligar quando quiser.'
                  : 'Nada seu aparece na lista. Ao ligar, seu nome, foto, profissão, especialidade e um botão de WhatsApp ficam visíveis para os membros da igreja.'}
              </Text>
              <Text className="mt-1 font-sans text-xs leading-4 text-ink-muted">
                Precisa de telefone e data de nascimento preenchidos. A data não
                aparece para ninguém, serve só para confirmar maioridade.
              </Text>
            </View>
            <Ionicons
              name={divulgarTrabalho ? 'toggle' : 'toggle-outline'}
              size={26}
              color={divulgarTrabalho ? colors.gold : colors.outline}
            />
          </Pressable>
        </View>

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
