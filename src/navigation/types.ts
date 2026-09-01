export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token?: string } | undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Ensino: undefined;
  Grupos: undefined;
  Oracao: undefined;
  Perfil: undefined;
};

// Pilha que envolve as abas — telas que "empilham" por cima da tab bar
// (não fazem sentido como aba própria: Devocionais, Eventos, detalhes).
export type AppStackParamList = {
  MainTabs: undefined;
  EditProfile: undefined;
  Devocionais: undefined;
  DevocionalDetail: { id: string };
  Eventos: undefined;
  EventoDetail: { id: string };
  CursoDetail: { id: string };
  EditCurso: { id: string };
  CreateCurso: undefined;
  Sala: { salaId: number; cursoNome: string };
  GroupDetail: { id: string };
  CreateGroup: undefined;
  InviteMember: { grupoId: number; grupoNome: string };
  CreateConteudo: { tipo?: 'Devocional' | 'Aviso'; id?: string } | undefined;
  CreateEvento: { id?: string } | undefined;
  CreateSala: { cursoId: string; cursoTitulo: string };
  SalaParticipantes: { salaId: number; cursoTitulo: string };
  Contribuir: undefined;
  Avisos: undefined;
  /** Diretório de membros — só Líder, Pastor e Administrador chegam aqui. */
  Membros: undefined;
  /** Trabalhos da comunidade — aberto a todo membro. */
  Profissionais: undefined;
  PlanoLeitura: undefined;
  /** Capa e frase do topo da Home — só Pastor e Administrador. */
  AparenciaHome: undefined;
  /**
   * Quem a pessoa escolheu não ver mais no mural, e o botão de desfazer.
   *
   * Exigência das lojas para app com conteúdo escrito por usuário: não basta
   * poder bloquear, tem que dar para rever e desfazer.
   */
  Bloqueados: undefined;
  /**
   * A fila de denúncias. Só liderança chega aqui pelo Perfil, e o serviço no
   * servidor recusa com 403 quem não tiver cargo — a tela é arrumação, a
   * guarda é lá.
   */
  Denuncias: undefined;
  /**
   * Exclusão da própria conta.
   *
   * Tela separada, e não um botão dentro do Perfil, de propósito: é a ação
   * sem volta do app. Exigir uma navegação a mais tira a chance do toque
   * distraído ao lado de "Sair".
   */
  ExcluirConta: undefined;
};
