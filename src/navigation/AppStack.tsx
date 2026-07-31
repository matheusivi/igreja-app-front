import { createNativeStackNavigator } from '@react-navigation/native-stack';
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
import { SalaParticipantesScreen } from '../screens/lideranca/SalaParticipantesScreen';
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
    </Stack.Navigator>
  );
}
