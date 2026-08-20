import { api } from './api';

/**
 * Um item da sequência do post.
 *
 * `valor` é o texto do parágrafo, ou a URL da imagem/vídeo.
 */
export type BlocoConteudo = {
  tipo: 'texto' | 'imagem' | 'video';
  valor: string;
};

export type Conteudo = {
  id: number;
  tipo: 'Estudo' | 'Devocional' | 'Aviso' | 'Material' | 'Apresentacao';
  titulo: string;
  formato: 'texto' | 'imagem' | 'vídeo' | 'combinacao';
  /** A sequência do post, na ordem escrita. É o que a leitura usa. */
  blocos: BlocoConteudo[];
  /** Derivados dos blocos pelo servidor — alimentam resumo e capa da lista. */
  texto: string | null;
  imagemUrl: string | null;
  videoUrl: string | null;
  principal: boolean;
  dataPublicacao: string;
  /** Só para avisos: depois desta data ele sai das listagens. */
  dataValidade: string | null;
  autor: { id: number; nomeCompleto: string; perfil: string };
};

type ListParams = {
  tipo?: Conteudo['tipo'];
  /** Traz avisos já vencidos — só a tela de gestão precisa. */
  incluirVencidos?: boolean;
  busca?: string;
  page?: number;
  limit?: number;
  orderBy?: 'recent' | 'oldest';
};

export function makeExcerpt(texto: string | null, maxLength = 140): string {
  if (!texto) return '';
  if (texto.length <= maxLength) return texto;
  return texto.slice(0, maxLength).replace(/\s\S*$/, '') + '…';
}

export type CreateConteudoPayload = {
  tipo: Conteudo['tipo'];
  titulo: string;
  /**
   * A sequência inteira. Na edição ela substitui a anterior — não é mesclada.
   * Os campos `texto`, `imagemUrl` e `videoUrl` são calculados pelo servidor
   * a partir daqui, e por isso não são enviados.
   */
  blocos: BlocoConteudo[];
  principal?: boolean;
  /** `null` remove a validade e o aviso volta a ser permanente. */
  dataValidade?: string | null;
};

/** Extrai o id de um link do YouTube, em qualquer um dos formatos comuns. */
/**
 * Minutos de leitura, arredondados para cima.
 *
 * 200 palavras por minuto é a média conservadora para leitura em tela — o
 * número comum na literatura é 200 a 250, e escolher o menor evita a promessa
 * quebrada de "2 min" numa leitura que leva 4.
 *
 * Serve para ajustar expectativa antes de começar: "3 min" convida, uma
 * parede de texto sem indicação faz a pessoa rolar até o fim para decidir se
 * vale a pena — e muitas fecham antes disso.
 */
export function minutosDeLeitura(texto: string | null): number {
  if (!texto) return 1;
  const palavras = texto.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(palavras / 200));
}

/**
 * Versão para quem tem os blocos em mãos (a tela de leitura).
 *
 * A listagem usa `minutosDeLeitura` direto sobre o campo `texto`, que o
 * servidor já derivou na gravação — não vale percorrer blocos de vinte itens
 * a cada render para chegar ao mesmo número.
 */
export function tempoDeLeitura(blocos: BlocoConteudo[]): number {
  return minutosDeLeitura(
    blocos
      .filter((b) => b.tipo === 'texto')
      .map((b) => b.valor)
      .join(' '),
  );
}

/**
 * Extrai o id de 11 caracteres de um link do YouTube.
 *
 * ═══ POR QUE OS PADRÕES SÃO ASSIM ═══
 * A versão anterior exigia que `v=` fosse o PRIMEIRO parâmetro
 * (`watch\?v=`). Só que o link que o YouTube entrega no botão de
 * compartilhar quase nunca vem limpo:
 *
 *   https://www.youtube.com/watch?app=desktop&v=ID   → v= não é o primeiro
 *   https://www.youtube.com/live/ID                  → transmissão ao vivo
 *   https://www.youtube-nocookie.com/embed/ID        → domínio sem cookie
 *
 * Nenhum desses era reconhecido, e a consequência não era um erro visível:
 * o editor dizia "Link do YouTube não reconhecido" e a leitura caía no
 * botão simples, sem capa. Culto transmitido ao vivo — que é justamente o
 * vídeo que uma igreja mais publica — caía sempre nesse buraco.
 *
 * Agora `[?&]v=` aceita a query em qualquer ordem, e `embed|shorts|live|v`
 * cobre os caminhos diretos.
 */
export function youtubeId(url: string): string | null {
  const limpo = url.trim();
  if (!limpo) return null;

  const padroes = [
    /youtu\.be\/([\w-]{11})/,
    /youtube(?:-nocookie)?\.com\/(?:embed|shorts|live|v)\/([\w-]{11})/,
    /youtube(?:-nocookie)?\.com\/[^\s]*[?&]v=([\w-]{11})/,
  ];
  for (const padrao of padroes) {
    const m = padrao.exec(limpo);
    if (m?.[1]) return m[1];
  }
  return null;
}

/**
 * URL canônica para abrir fora do app.
 *
 * ═══ O BUG QUE ISTO RESOLVE ═══
 * `Linking.openURL` precisa de ESQUEMA. Quem cola "youtube.com/watch?v=ID"
 * sem o `https://` — que é o que sobra ao copiar da barra do Chrome no
 * Android — gera uma URL que o sistema não sabe resolver. A promessa
 * rejeita, e como a chamada era `void Linking.openURL(url)`, a rejeição era
 * engolida em silêncio: o toque simplesmente não fazia nada.
 *
 * Tendo o id, não vale a pena consertar a string do usuário: monta-se a URL
 * canônica. É ela que o app do YouTube registra como universal link / app
 * link, então o sistema entrega ao aplicativo se ele estiver instalado, e ao
 * navegador se não estiver — sem o app precisar decidir nada.
 */
export function urlDoVideo(url: string): string {
  const id = youtubeId(url);
  if (id) return `https://www.youtube.com/watch?v=${id}`;

  const limpo = url.trim();
  return /^https?:\/\//i.test(limpo) ? limpo : `https://${limpo}`;
}

export type PaginaConteudos = {
  data: Conteudo[];
  total: number;
  page: number;
  totalPages: number;
};

export const contentService = {
  /**
   * Uma página de avisos ou devocionais.
   *
   * Devolve `total` e `totalPages` junto — sem eles a rolagem infinita não
   * sabe quando parar. Quem só quer os itens usa `.data`, que é o que a Home
   * faz ao pedir três avisos.
   */
  async listPagina(params: ListParams = {}): Promise<PaginaConteudos> {
    const { data } = await api.get('/api/conteudos', { params });
    return {
      data: (data.data ?? []) as Conteudo[],
      total: data.total ?? 0,
      page: data.page ?? 1,
      totalPages: data.totalPages ?? 1,
    };
  },

  async list(params: ListParams = {}): Promise<Conteudo[]> {
    const { data } = await api.get('/api/conteudos', { params });
    return (data.data ?? []) as Conteudo[];
  },

  async get(id: string | number): Promise<Conteudo> {
    const { data } = await api.get(`/api/conteudos/${id}`);
    return data.data as Conteudo;
  },

  async create(payload: CreateConteudoPayload): Promise<Conteudo> {
    const { data } = await api.post('/api/conteudos', payload);
    return data.data as Conteudo;
  },

  async update(id: number, payload: Partial<CreateConteudoPayload>): Promise<Conteudo> {
    const { data } = await api.put(`/api/conteudos/${id}`, payload);
    return data.data as Conteudo;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/api/conteudos/${id}`);
  },
};
