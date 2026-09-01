import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ContribuirScreen } from '../screens/ContribuirScreen';
import { AvisosScreen } from '../screens/avisos/AvisosScreen';
import { CourseDetailScreen } from '../screens/ensino/CourseDetailScreen';
import { EditCursoScreen } from '../screens/ensino/EditCursoScreen';
import { CreateCursoScreen } from '../screens/ensino/CreateCursoScreen';
import { SalaScreen } from '../screens/ensino/SalaScreen';
import { DevotionalDetailScreen } from '../screens/devocionais/DevotionalDetailScreen';
import { DevotionalsListScreen } from '../screens/devocionais/DevotionalsListScreen';
import { EventoDetailScreen } from '../screens/eventos/EventoDetailScreen';
import { EventsScreen } from '../screens/eventos/EventsScreen';
import { GroupDetailScreen } from '../screens/grupos/GroupDetailScreen';
import { CreateGroupScreen } from '../screens/grupos/CreateGroupScreen';
import { InviteMemberScreen } from '../screens/grupos/InviteMemberScreen';
import { EditProfileScreen } from '../screens/perfil/EditProfileScreen';
import { CreateConteudoScreen } from '../screens/lideranca/CreateConteudoScreen';
import { CreateEventoScreen } from '../screens/lideranca/CreateEventoScreen';
import { CreateSalaScreen } from '../screens/lideranca/CreateSalaScreen';
import { MembrosScreen } from '../screens/lideranca/MembrosScreen';
import { PlanoLeituraScreen } from '../screens/leitura/PlanoLeituraScreen';
import { ProfissionaisScreen } from '../screens/comunidade/ProfissionaisScreen';
import { AparenciaHomeScreen } from '../screens/lideranca/AparenciaHomeScreen';
import { SalaParticipantesScreen } from '../screens/lideranca/SalaParticipantesScreen';
import { DenunciasScreen } from '../screens/lideranca/DenunciasScreen';
import { BloqueadosScreen } from '../screens/perfil/BloqueadosScreen';
import { ExcluirContaScreen } from '../screens/perfil/ExcluirContaScreen';
import { MainTabs } from './MainTabs';
import type { AppStackParamList } from './types';

const Stack = createNativeStackNavigator<AppStackParamList>();

// Pilha que fica "por cima" das abas — Devocionais, Eventos e telas de
// detalhe empilham aqui, sem precisar virar aba própria (ver types.ts).
export function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Contribuir" component={ContribuirScreen} />
      <Stack.Screen name="Avisos" component={AvisosScreen} />
      {/* Gestão de liderança. A rota existe para todos; quem controla o acesso
          é o Perfil, que só mostra a entrada para Pastor e Administrador.

          E isso é arrumação, não a guarda: quem chegar aqui de outro jeito vê
          a busca, mas a AÇÃO é recusada com 403 pelo `requireRole` da rota de
          perfil. Tela não é lugar de guardar permissão. */}
      <Stack.Screen name="Membros" component={MembrosScreen} />
      <Stack.Screen name="Profissionais" component={ProfissionaisScreen} />
      <Stack.Screen name="PlanoLeitura" component={PlanoLeituraScreen} />
      <Stack.Screen name="AparenciaHome" component={AparenciaHomeScreen} />
      <Stack.Screen name="Devocionais" component={DevotionalsListScreen} />
      <Stack.Screen name="DevocionalDetail" component={DevotionalDetailScreen} />
      <Stack.Screen name="Eventos" component={EventsScreen} />
      <Stack.Screen name="EventoDetail" component={EventoDetailScreen} />
      <Stack.Screen name="CursoDetail" component={CourseDetailScreen} />
      <Stack.Screen name="EditCurso" component={EditCursoScreen} />
      <Stack.Screen name="CreateCurso" component={CreateCursoScreen} />
      <Stack.Screen name="Sala" component={SalaScreen} />
      <Stack.Screen name="GroupDetail" component={GroupDetailScreen} />
      <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
      <Stack.Screen name="InviteMember" component={InviteMemberScreen} />
      <Stack.Screen name="CreateConteudo" component={CreateConteudoScreen} />
      <Stack.Screen name="CreateEvento" component={CreateEventoScreen} />
      <Stack.Screen name="CreateSala" component={CreateSalaScreen} />
      <Stack.Screen name="SalaParticipantes" component={SalaParticipantesScreen} />
      {/* Moderação e saída da conta. Exigências das duas lojas para publicar:
          conteúdo escrito por usuário precisa de denunciar e bloquear, e quem
          cria conta precisa conseguir apagá-la de dentro do app. */}
      <Stack.Screen name="Bloqueados" component={BloqueadosScreen} />
      <Stack.Screen name="ExcluirConta" component={ExcluirContaScreen} />
      <Stack.Screen name="Denuncias" component={DenunciasScreen} />
    </Stack.Navigator>
  );
}
