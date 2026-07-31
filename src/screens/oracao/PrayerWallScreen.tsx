import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Avatar,
  Button,
  Card,
  Chip,
  ScriptureQuote,
  TextField,
} from "../../components";
import { useThemeColors } from "../../hooks/useThemeColors";
import {
  useCriarPedido,
  useExcluirPedido,
  usePedidosOracao,
} from "../../hooks/queries/usePedidosOracao";
import { useAuth } from "../../navigation/AuthContext";
import { extractErrorMessage } from "../../services/api";
import {
  formatRelativeTime,
  type PedidoOracao,
} from "../../services/prayer.service";

type Filter = "geral" | "meus";

const filters: { key: Filter; label: string }[] = [
  { key: "geral", label: "Geral" },
  { key: "meus", label: "Meus pedidos" },
];

const MIN_CARACTERES = 10;

export function PrayerWallScreen() {
  const colors = useThemeColors();
  const { user } = useAuth();

  const {
    data: requests = [],
    isPending,
    isFetching,
    error: queryError,
    refetch,
  } = usePedidosOracao();
  const criarPedido = useCriarPedido();
  const excluirPedido = useExcluirPedido();

  const [activeFilter, setActiveFilter] = useState<Filter>("geral");

  // Reações são só visuais por enquanto: o backend ainda não tem endpoint
  // para guardar quem está orando por qual pedido.
  const [reactions, setReactions] = useState<
    Record<number, { praying: boolean; amen: boolean }>
  >({});

  const [showingForm, setShowingForm] = useState(false);
  const [newRequest, setNewRequest] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const error = queryError ? extractErrorMessage(queryError) : null;
  const restantes = MIN_CARACTERES - newRequest.trim().length;

  function handleSubmit() {
    const texto = newRequest.trim();
    if (texto.length < MIN_CARACTERES) {
      setSubmitError(`Escreva pelo menos ${MIN_CARACTERES} caracteres.`);
      return;
    }
    setSubmitError(null);
    criarPedido.mutate(texto, {
      onSuccess: () => {
        setNewRequest("");
        setShowingForm(false);
      },
      onError: (e) =>
        setSubmitError(
          extractErrorMessage(e, "Não foi possível enviar o pedido."),
        ),
    });
  }

  /** Pastor e Administrador moderam o mural; os demais só apagam o próprio. */
  const isModerador = ["Pastor", "Administrador"].includes(user?.perfil ?? "");

  function podeExcluir(pedido: PedidoOracao): boolean {
    return pedido.autor.id === user?.id || isModerador;
  }

  function confirmarExclusao(pedido: PedidoOracao) {
    const ehMeu = pedido.autor.id === user?.id;
    Alert.alert(
      "Excluir pedido",
      ehMeu
        ? "Deseja remover o seu pedido de oração?"
        : `Excluir o pedido de ${pedido.autor.nomeCompleto || "outro membro"}? Como ${user?.perfil}, você está moderando o mural.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () =>
            excluirPedido.mutate(pedido.id, {
              onError: (e) =>
                Alert.alert(
                  "Erro",
                  extractErrorMessage(e, "Não foi possível excluir."),
                ),
            }),
        },
      ],
    );
  }

  function toggleReaction(id: number, kind: "praying" | "amen") {
    setReactions((current) => {
      const entry = current[id] ?? { praying: false, amen: false };
      return { ...current, [id]: { ...entry, [kind]: !entry[kind] } };
    });
  }

  const filteredRequests = useMemo(() => {
    if (activeFilter === "meus")
      return requests.filter((r) => r.autor.id === user?.id);
    return requests;
  }, [requests, activeFilter, user?.id]);

  const meusPedidosCount = requests.filter(
    (r) => r.autor.id === user?.id,
  ).length;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="flex-row items-center justify-between border-b border-outline-variant bg-header px-gutter py-4">
        <Text className="font-serif-bold text-xl text-on-header">
          Pedidos de Oração
        </Text>
        {isFetching && !isPending ? (
          <ActivityIndicator size="small" color={colors.gold} />
        ) : null}
      </View>

      <ScrollView
        className="flex-1 px-gutter"
        contentContainerClassName="gap-md py-lg"
      >
        <ScriptureQuote
          text="Pois onde dois ou três estiverem reunidos em meu nome, ali estou eu no meio deles."
          reference="Mateus 18:20"
        />

        <View className="flex-row gap-2">
          {filters.map((filter) => (
            <Chip
              key={filter.key}
              label={
                filter.key === "meus" && meusPedidosCount > 0
                  ? `${filter.label} (${meusPedidosCount})`
                  : filter.label
              }
              active={activeFilter === filter.key}
              onPress={() => setActiveFilter(filter.key)}
            />
          ))}
        </View>

        {/* Formulário inline */}
        {showingForm ? (
          <Card accent contentClassName="gap-3">
            <Text className="font-serif-bold text-base text-ink">
              Compartilhe seu pedido
            </Text>
            <TextField
              label="Seu pedido de oração"
              placeholder="Escreva o que gostaria que a igreja levasse a Deus..."
              value={newRequest}
              onChangeText={(v) => {
                setNewRequest(v);
                setSubmitError(null);
              }}
              multiline
              numberOfLines={4}
            />
            {/* Contador, em vez de um botão travado sem explicação */}
            <Text className="font-sans text-xs text-ink-muted">
              {restantes > 0
                ? `Faltam ${restantes} ${restantes === 1 ? "caractere" : "caracteres"}.`
                : `${newRequest.trim().length} caracteres.`}
            </Text>
            {submitError ? (
              <Text className="font-sans text-xs text-error">
                {submitError}
              </Text>
            ) : null}
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Button
                  label="Enviar pedido"
                  loading={criarPedido.isPending}
                  disabled={restantes > 0}
                  icon={
                    <Ionicons name="send" size={16} color={colors.onGold} />
                  }
                  onPress={handleSubmit}
                />
              </View>
              <View className="flex-1">
                <Button
                  label="Cancelar"
                  variant="secondary"
                  onPress={() => {
                    setShowingForm(false);
                    setNewRequest("");
                    setSubmitError(null);
                  }}
                />
              </View>
            </View>
          </Card>
        ) : null}

        {/* pb-24 reserva espaço pro botão flutuante não cobrir o último card */}
        <View className="gap-3 pb-24">
          {isPending ? (
            <ActivityIndicator
              size="large"
              color={colors.gold}
              style={{ marginTop: 16 }}
            />
          ) : error ? (
            <View className="items-center gap-3 py-8">
              <Text className="text-center font-sans text-sm text-ink-muted">
                {error}
              </Text>
              <Button
                label="Tentar novamente"
                variant="secondary"
                fullWidth={false}
                onPress={() => refetch()}
              />
            </View>
          ) : filteredRequests.length === 0 ? (
            <Card contentClassName="items-center gap-2 py-8">
              <Ionicons name="heart-outline" size={28} color={colors.outline} />
              <Text className="text-center font-sans-semibold text-base text-ink">
                {activeFilter === "meus"
                  ? "Você ainda não enviou nenhum pedido"
                  : "Nenhum pedido por aqui ainda"}
              </Text>
              <Text className="text-center font-sans text-sm text-ink-muted">
                {activeFilter === "meus"
                  ? "Compartilhe o que está no seu coração, a igreja ora com você."
                  : "Seja o primeiro a compartilhar um pedido com a comunidade."}
              </Text>
            </Card>
          ) : (
            filteredRequests.map((request) => {
              const reaction = reactions[request.id] ?? {
                praying: false,
                amen: false,
              };
              const isMeu = request.autor.id === user?.id;
              const isLideranca = ["Líder", "Pastor", "Administrador"].includes(
                request.autor.perfil,
              );

              return (
                <Card key={request.id} accent contentClassName="gap-3">
                  <View className="flex-row items-center gap-3">
                    <Avatar
                      nome={request.autor.nomeCompleto}
                      fotoUrl={request.autor.fotoUrl}
                      size={40}
                    />

                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <Text
                          className="font-sans-semibold text-sm text-ink"
                          numberOfLines={1}
                        >
                          {request.autor.nomeCompleto || "Membro da igreja"}
                        </Text>
                        {isMeu ? (
                          <Text className="font-sans-semibold text-[10px] uppercase text-primary">
                            Você
                          </Text>
                        ) : null}
                      </View>

                      {/* Função na igreja + quando foi enviado, logo abaixo do nome */}
                      <View className="flex-row items-center gap-1">
                        {isLideranca ? (
                          <>
                            <Text className="font-sans-semibold text-xs text-secondary">
                              {request.autor.perfil}
                            </Text>
                            <Text className="font-sans text-xs text-outline">
                              ·
                            </Text>
                          </>
                        ) : null}
                        <Text className="font-sans text-xs text-ink-muted">
                          {formatRelativeTime(request.dataEnvio)}
                        </Text>
                      </View>
                    </View>

                    {podeExcluir(request) ? (
                      <Pressable
                        hitSlop={8}
                        onPress={() => confirmarExclusao(request)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          // Vermelho quando é moderação (pedido de outra
                          // pessoa), discreto quando é o próprio pedido.
                          color={isMeu ? colors.outline : colors.error}
                        />
                      </Pressable>
                    ) : null}
                  </View>

                  <Text className="font-sans text-base leading-6 text-ink">
                    {request.descricaoPedido}
                  </Text>

                  <View className="flex-row items-center gap-2 border-t border-outline-variant pt-3">
                    <Pressable
                      onPress={() => toggleReaction(request.id, "praying")}
                      className={[
                        "flex-row items-center gap-1.5 rounded-full border px-3 py-2",
                        reaction.praying
                          ? "border-success bg-success-soft"
                          : "border-outline-variant",
                      ].join(" ")}
                    >
                      <Ionicons
                        name={reaction.praying ? "heart" : "heart-outline"}
                        size={14}
                        color={reaction.praying ? colors.onSuccess : colors.ink}
                      />
                      <Text
                        className={[
                          "font-sans-medium text-xs",
                          reaction.praying ? "text-on-success" : "text-ink",
                        ].join(" ")}
                      >
                        {reaction.praying ? "Orando" : "Vou orar"}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => toggleReaction(request.id, "amen")}
                      className={[
                        "flex-row items-center gap-1.5 rounded-full border px-3 py-2",
                        reaction.amen
                          ? "border-gold bg-gold"
                          : "border-outline-variant",
                      ].join(" ")}
                    >
                      <Text
                        className={[
                          "font-sans-medium text-xs",
                          reaction.amen ? "text-on-gold" : "text-ink",
                        ].join(" ")}
                      >
                        Amém
                      </Text>
                    </Pressable>
                  </View>
                </Card>
              );
            })
          )}
        </View>
      </ScrollView>

      {!showingForm ? (
        <View className="absolute bottom-6 right-gutter">
          <Button
            label="Pedido"
            icon={<Ionicons name="add" size={18} color={colors.onGold} />}
            fullWidth={false}
            onPress={() => {
              setShowingForm(true);
              setSubmitError(null);
            }}
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
}
