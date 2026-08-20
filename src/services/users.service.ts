import { api } from './api';

export type PerfilUsuario = 'Membro' | 'Líder' | 'Pastor' | 'Administrador';

export type Aniversariante = {
  id: number;
  nomeCompleto: string;
  fotoUrl: string | null;
  /** Opcional por segurança: instalações antigas do backend podem não enviar. */
  perfil?: PerfilUsuario | string;
  /**
   * Nome do grupo familiar, quando a pessoa tem vínculo ACEITO com algum.
   *
   * Opcional pelo mesmo motivo do `perfil`: um servidor que ainda não subiu a
   * versão com este campo simplesmente não manda, e a tela precisa continuar
   * funcionando em vez de mostrar "undefined" embaixo do nome.
   */
  familia?: string | null;
  /** Foto do grupo familiar. Vira miniatura na ficha do aniversariante. */
  familiaFoto?: string | null;
  profissao?: string | null;
};

export type AniversarianteDia = {
  dia: number;
  aniversariantes: Aniversariante[];
};

/**
 * Uma pessoa no diretório profissional.
 *
 * Repare no que NÃO vem: idade, data de nascimento, e-mail, família. A lista
 * é visível para todo membro logado, então carrega só o necessário para
 * escolher um prestador e falar com ele. A data de nascimento fica no
 * servidor, usada apenas para barrar menores de idade.
 */
export type Profissional = {
  id: number;
  nomeCompleto: string;
  fotoUrl: string | null;
  profissao: string | null;
  especializacao: string | null;
  /** Só dígitos. A tela formata e monta o link do WhatsApp. */
  telefone: string | null;
};

export type PaginaProfissionais = {
  data: Profissional[];
  total: number;
  page: number;
  totalPages: number;
};

export type UsuarioResumo = {
  id: number;
  nomeCompleto: string;
  fotoUrl: string | null;
  perfil: string;
  /** Só para concordância de gênero ao escolher o papel: "Filha", não "Filho". */
  sexo?: string | null;
  /**
   * A família da pessoa, quando ela tem vínculo ACEITO em alguma.
   *
   * Vem junto do resultado da busca de propósito. Quem procura alguém na
   * igreja quase nunca quer só o nome — quer saber de que casa a pessoa é.
   * E, no convite, é o que impede o líder de escolher alguém que o servidor
   * vai recusar: cada pessoa pertence a uma família por vez.
   *
   * `null` nos dois quando ainda não pertence a nenhuma — que é informação
   * útil por si, porque é exatamente quem a liderança precisa acolher.
   *
   * Opcionais na tipagem porque um servidor que ainda não subiu a versão com
   * estes campos simplesmente não os manda, e a tela precisa continuar de pé
   * em vez de escrever "undefined" embaixo do nome.
   */
  familiaId?: number | null;
  familia?: string | null;
};

export const usersService = {
  async fetchAniversariantes(mes?: number): Promise<AniversarianteDia[]> {
    const { data } = await api.get(
      '/api/usuarios/aniversariantes',
      mes ? { params: { mes } } : undefined,
    );
    // O controller responde { success, mes, data: [ {dia, aniversariantes} ] }
    // — o payload NÃO vem aninhado duas vezes. Estava lendo `data.data.data`,
    // que é sempre undefined, então a lista vinha vazia SEMPRE.
    return (data.data ?? []) as AniversarianteDia[];
  },

  /**
   * O diretório profissional.
   *
   * Devolve a página inteira (não só `data`) porque a rolagem infinita
   * precisa de `page` e `totalPages` para saber quando parar de pedir.
   */
  async listarProfissionais(
    busca: string | undefined,
    page: number,
    limit: number,
  ): Promise<PaginaProfissionais> {
    const { data } = await api.get('/api/usuarios/profissionais', {
      params: { ...(busca ? { busca } : {}), page, limit },
    });
    return {
      data: (data.data ?? []) as Profissional[],
      total: data.total ?? 0,
      page: data.page ?? page,
      totalPages: data.totalPages ?? 1,
    };
  },

  async search(busca: string, page = 1, limit = 20): Promise<UsuarioResumo[]> {
    const { data } = await api.get('/api/usuarios', { params: { busca, page, limit } });
    return (data.data ?? []) as UsuarioResumo[];
  },

  /**
   * Todo mundo que tem um determinado perfil, em ordem alfabética.
   *
   * Sem termo de busca a consulta cai na faixa 0 de relevância e volta a
   * ordenar por nome — que é o certo quando não há nada para ranquear.
   *
   * `limit` alto porque líder não é lista que rola: uma igreja com trinta
   * líderes já é grande, e paginar isso custaria mais interface do que
   * resolve. Se um dia passar de 100, o teto do servidor avisa.
   */
  async listarPorPerfil(
    perfil: PerfilUsuario,
    limit = 100,
  ): Promise<UsuarioResumo[]> {
    const { data } = await api.get('/api/usuarios', { params: { perfil, limit } });
    return (data.data ?? []) as UsuarioResumo[];
  },

  /**
   * Promove a Líder ou devolve a Membro.
   *
   * Só esses dois: Pastor e Administrador são definidos direto no banco. A
   * rota e o schema recusam qualquer outra coisa, então a assinatura estreita
   * aqui não é uma trava — é o tipo dizendo a verdade sobre o que existe.
   *
   * Mora em `/api/auth` porque perfil é assunto de autorização, não de
   * cadastro. O caminho destoa do resto deste arquivo por isso.
   */
  async definirLideranca(
    usuarioId: number,
    perfil: 'Membro' | 'Líder',
  ): Promise<void> {
    await api.patch(`/api/auth/usuarios/${usuarioId}/perfil`, { perfil });
  },
};
