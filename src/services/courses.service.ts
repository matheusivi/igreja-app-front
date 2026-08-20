import { api } from './api';

export type CursoPayload = {
  nome?: string;
  descricaoMaterial?: string;
  categoria?: string;
  duracao?: string | null;
  publicoAlvo?: string | null;
  /** Quando enviado, substitui a ementa inteira no servidor. */
  capitulos?: { ordem: number; titulo: string; secao: string | null }[];
};

export type Capitulo = {
  id: number;
  ordem: number;
  titulo: string;
  /** Agrupamento opcional: "Parte 1 – Comunicação", "Módulo 2". */
  secao: string | null;
};

export type Curso = {
  id: number;
  nome: string;
  descricaoMaterial: string | null;
  categoria: 'Homens' | 'Mulheres' | 'Casais' | 'Jovens' | 'Geral' | 'Batismo';
  duracao: string | null;
  publicoAlvo: string | null;
  capitulos: Capitulo[];
  criador: { id: number; nomeCompleto: string; perfil: string };
};

/**
 * Item da ementa enquanto está sendo editada.
 *
 * A ementa é editada como uma lista única onde divisões e aulas convivem —
 * é assim que a pessoa pensa ("Parte 1, aula 1, aula 2, Parte 2, aula 3").
 * No banco não existe registro de divisão: cada capítulo carrega o nome da
 * sua seção. A conversão entre as duas formas mora aqui.
 */
export type ItemEmenta =
  | { id: string; tipo: 'secao'; texto: string }
  | { id: string; tipo: 'capitulo'; titulo: string };

let contadorId = 0;
export function novoIdEmenta(): string {
  contadorId += 1;
  return `item-${contadorId}`;
}

/** Capítulos do servidor → lista editável, inserindo divisões onde a seção muda. */
export function capitulosParaItens(capitulos: Capitulo[]): ItemEmenta[] {
  const itens: ItemEmenta[] = [];
  let secaoAtual: string | null = null;

  for (const cap of capitulos) {
    const secao = cap.secao ?? null;
    if (secao !== secaoAtual) {
      secaoAtual = secao;
      if (secao) itens.push({ id: novoIdEmenta(), tipo: 'secao', texto: secao });
    }
    itens.push({ id: novoIdEmenta(), tipo: 'capitulo', titulo: cap.titulo });
  }
  return itens;
}

/** Lista editável → payload do servidor. A numeração é recalculada aqui. */
export function itensParaCapitulos(
  itens: ItemEmenta[],
): { ordem: number; titulo: string; secao: string | null }[] {
  const capitulos: { ordem: number; titulo: string; secao: string | null }[] = [];
  let secaoAtual: string | null = null;

  for (const item of itens) {
    if (item.tipo === 'secao') {
      secaoAtual = item.texto.trim() || null;
      continue;
    }
    const titulo = item.titulo.trim();
    // Linha em branco é descartada em vez de virar capítulo vazio: quem
    // adiciona uma aula e desiste não deveria gravar lixo.
    if (!titulo) continue;
    capitulos.push({ ordem: capitulos.length + 1, titulo, secao: secaoAtual });
  }
  return capitulos;
}

/**
 * Agrupa a ementa por seção preservando a ordem original.
 *
 * Cursos sem seção caem num único grupo com chave null, e a tela só mostra a
 * lista corrida — sem cabeçalho vazio.
 */
export function agruparCapitulos(
  capitulos: Capitulo[],
): { secao: string | null; itens: Capitulo[] }[] {
  const grupos: { secao: string | null; itens: Capitulo[] }[] = [];
  for (const cap of capitulos) {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.secao === (cap.secao ?? null)) {
      ultimo.itens.push(cap);
    } else {
      grupos.push({ secao: cap.secao ?? null, itens: [cap] });
    }
  }
  return grupos;
}

/**
 * Espelha exatamente o `SalaResponse` do backend.
 *
 * A versão anterior tinha campos inventados (`cursoNome`, `liderNome`,
 * `totalMatriculas`, `capacidade`) que a API nunca enviou — vinham `undefined`
 * e a tela simplesmente não renderizava o bloco do líder nem a lotação. Ao
 * mesmo tempo ignorava `nomeSala`, `dataInicio`, `dataFim` e `status`, que
 * existiam. TypeScript não valida resposta de rede, então o erro só aparecia
 * como um card vazio.
 */
export type PublicoSala = 'Todos' | 'Homens' | 'Mulheres';

export type Sala = {
  id: number;
  cursoId: number;
  nomeSala: string;
  /** Quem pode participar desta turma. */
  publico: PublicoSala;
  dataInicio: string | null;
  dataFim: string | null;
  status: 'ativa' | 'inativa' | 'concluída';
  capacidade: number | null;
  totalMatriculas: number;
  lider: { id: number; nomeCompleto: string; fotoUrl: string | null } | null;
  curso: { id: number; nome: string };
};

export type CreateSalaPayload = {
  nomeSala: string;
  dataInicio?: string;
  dataFim?: string;
  capacidade?: number | null;
  publico?: PublicoSala;
};

export type UpdateSalaPayload = Partial<CreateSalaPayload> & {
  status?: Sala['status'];
};

/** Vagas restantes, ou null quando a turma não tem limite. */
export function vagasRestantes(sala: Sala): number | null {
  if (sala.capacidade === null) return null;
  return Math.max(0, sala.capacidade - sala.totalMatriculas);
}

/**
 * A pessoa pode participar desta turma?
 *
 * O servidor já filtra na listagem, mas a tela também precisa saber para
 * explicar o motivo em vez de mostrar uma lista vazia.
 */
export function podeParticipar(
  publico: PublicoSala,
  sexo: string | undefined,
): boolean {
  if (publico === 'Todos') return true;
  if (publico === 'Homens') return sexo === 'Masculino';
  return sexo === 'Feminino';
}

/** "Este curso é exclusivo para mulheres", ou null se a pessoa tem acesso. */
export function motivoSemAcesso(
  categoria: Curso['categoria'],
  sexo: string | undefined,
): string | null {
  if (categoria === 'Homens' && sexo !== 'Masculino') {
    return 'Este curso é exclusivo para homens.';
  }
  if (categoria === 'Mulheres' && sexo !== 'Feminino') {
    return 'Este curso é exclusivo para mulheres.';
  }
  return null;
}

/** "10/03/2026 a 20/05/2026", "a partir de 10/03/2026", ou null. */
export function formatPeriodoSala(sala: Sala): string | null {
  const fmt = (iso: string) => new Date(iso).toLocaleDateString('pt-BR');
  if (sala.dataInicio && sala.dataFim) {
    return `${fmt(sala.dataInicio)} a ${fmt(sala.dataFim)}`;
  }
  if (sala.dataInicio) return `A partir de ${fmt(sala.dataInicio)}`;
  if (sala.dataFim) return `Até ${fmt(sala.dataFim)}`;
  return null;
}

export type ParticipanteSala = {
  usuarioId: number;
  nomeCompleto: string;
  email: string;
  status: 'ativo' | 'concluido' | 'desistente' | 'cancelado_pelo_usuario';
};

export type MatriculaHistorico = {
  salaId: number;
  cursoId: number;
  nomeCurso: string;
  categoria: string;
  status: 'ativo' | 'concluido' | 'desistente' | 'cancelado_pelo_usuario';
  nomeSala?: string;
  dataAdicao: string;
};

export type ColegaSala = {
  usuarioId: number;
  nomeCompleto: string;
  perfil: string;
};

export const coursesService = {
  async listCursos(categoria?: string): Promise<Curso[]> {
    const { data } = await api.get('/api/cursos', {
      params: { ...(categoria ? { categoria } : {}), limit: 50 },
    });
    return (data.data ?? []) as Curso[];
  },

  async getCurso(id: string | number): Promise<Curso> {
    const { data } = await api.get(`/api/cursos/${id}`);
    return data.data as Curso;
  },

  async createCurso(payload: CursoPayload & { nome: string; categoria: string }): Promise<Curso> {
    const { data } = await api.post('/api/cursos', payload);
    return data.data as Curso;
  },

  async updateCurso(id: number, payload: CursoPayload): Promise<Curso> {
    const { data } = await api.put(`/api/cursos/${id}`, payload);
    return data.data as Curso;
  },

  async deleteCurso(id: number): Promise<void> {
    await api.delete(`/api/cursos/${id}`);
  },

  /**
   * Turmas de um curso.
   *
   * O filtro de status vai na query, não no app: depois de alguns anos a
   * igreja terá dezenas de turmas encerradas por curso, e trazer todas para
   * a tela descartar seria carga inútil no banco e na rede.
   */
  async listSalas(
    cursoId: string | number,
    status: Sala['status'] | 'todas' = 'ativa',
  ): Promise<Sala[]> {
    const { data } = await api.get('/api/salas', {
      params: { cursoId, ...(status !== 'todas' ? { status } : {}) },
    });
    return (data.data ?? []) as Sala[];
  },

  async enroll(salaId: number): Promise<void> {
    await api.post(`/api/matriculas/${salaId}`);
  },

  async cancelEnroll(salaId: number): Promise<void> {
    await api.delete(`/api/matriculas/${salaId}`);
  },

  async getHistorico(): Promise<MatriculaHistorico[]> {
    const { data } = await api.get('/api/matriculas/historico');
    return (data.data ?? []) as MatriculaHistorico[];
  },

  async createSala(cursoId: string | number, payload: CreateSalaPayload): Promise<Sala> {
    const { data } = await api.post(`/api/salas/${cursoId}`, payload);
    return data.data as Sala;
  },

  async updateSala(salaId: number, payload: UpdateSalaPayload): Promise<Sala> {
    const { data } = await api.put(`/api/salas/${salaId}`, payload);
    return data.data as Sala;
  },

  /**
   * Apaga a turma de vez. Serve para turma criada por engano.
   *
   * O servidor recusa se houver matrículas, exceto para administrador — quem
   * tem gente inscrita deve ser encerrada, não excluída.
   */
  async deleteSala(salaId: number): Promise<void> {
    await api.delete(`/api/salas/${salaId}`);
  },

  async getParticipantes(salaId: number): Promise<ParticipanteSala[]> {
    const { data } = await api.get(`/api/matriculas/sala/${salaId}/participantes`);
    return (data.data ?? []) as ParticipanteSala[];
  },

  async getColegas(salaId: number): Promise<ColegaSala[]> {
    const { data } = await api.get(`/api/matriculas/sala/${salaId}/colegas`);
    return (data.data ?? []) as ColegaSala[];
  },

  async updateParticipanteStatus(
    salaId: number,
    usuarioId: number,
    status: 'concluido' | 'desistente',
  ): Promise<void> {
    await api.patch(`/api/matriculas/sala/${salaId}/participantes/${usuarioId}/status`, { status });
  },
};
