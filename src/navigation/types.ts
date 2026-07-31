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
  CreateConteudo: { tipo?: 'Devocional' | 'Estudo' | 'Aviso'; id?: string } | undefined;
  CreateEvento: { id?: string } | undefined;
  CreateSala: { cursoId: string; cursoTitulo: string };
  SalaParticipantes: { salaId: number; cursoTitulo: string };
};
