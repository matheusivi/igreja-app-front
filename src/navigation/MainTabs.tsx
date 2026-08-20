import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CoursesListScreen } from '../screens/ensino/CoursesListScreen';
import { GroupsScreen } from '../screens/grupos/GroupsScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { PrayerWallScreen } from '../screens/oracao/PrayerWallScreen';
import { ProfileScreen } from '../screens/perfil/ProfileScreen';
import { TabBar } from './TabBar';
import type { MainTabParamList } from './types';

// Devocionais e Eventos não viram abas — são acessados pelos atalhos da Home.
// Com isso a barra fica em 5 itens (o teto para alcance do polegar), em vez
// das 7 seções que as telas originais sugeriam.
const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * A barra é um componente próprio (`./TabBar`), não a padrão configurada por
 * `screenOptions`. Trocar cor e ícone na barra padrão é o que todo mundo faz,
 * e é por isso que todo app com Tab Navigator padrão se parece. A estrutura
 * do item — que é onde mora a personalidade — só muda com `tabBar`.
 */
export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Ensino" component={CoursesListScreen} options={{ title: 'Ensino' }} />
      <Tab.Screen name="Grupos" component={GroupsScreen} options={{ title: 'Famílias' }} />
      <Tab.Screen name="Oracao" component={PrayerWallScreen} options={{ title: 'Oração' }} />
      <Tab.Screen name="Perfil" component={ProfileScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}
