import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { fonts } from '../constants/theme';
import { useThemeColors } from '../hooks/useThemeColors';
import { CoursesListScreen } from '../screens/ensino/CoursesListScreen';
import { GroupsScreen } from '../screens/grupos/GroupsScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { PrayerWallScreen } from '../screens/oracao/PrayerWallScreen';
import { ProfileScreen } from '../screens/perfil/ProfileScreen';
import type { MainTabParamList } from './types';

// Devocionais e Eventos não viram abas — são acessados pelo grid de acesso
// rápido da Home. Com isso a tab bar fica em 5 itens (o teto recomendado
// para alcance do polegar em telas de celular), em vez das 7 seções que
// as 15 telas originais do Stitch sugeriam.
const Tab = createBottomTabNavigator<MainTabParamList>();

const icons: Record<keyof MainTabParamList, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Ensino: { active: 'school', inactive: 'school-outline' },
  Grupos: { active: 'people', inactive: 'people-outline' },
  Oracao: { active: 'heart', inactive: 'heart-outline' },
  Perfil: { active: 'person', inactive: 'person-outline' },
};

export function MainTabs() {
  const colors = useThemeColors();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.outline,
        tabBarStyle: { backgroundColor: colors.header, borderTopWidth: 0 },
        tabBarLabelStyle: { fontFamily: fonts.sansMedium, fontSize: 11 },
        tabBarIcon: ({ focused, color, size }) => {
          const set = icons[route.name as keyof MainTabParamList];
          return <Ionicons name={focused ? set.active : set.inactive} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Ensino" component={CoursesListScreen} options={{ title: 'Ensino' }} />
      <Tab.Screen name="Grupos" component={GroupsScreen} options={{ title: 'Famílias' }} />
      <Tab.Screen name="Oracao" component={PrayerWallScreen} options={{ title: 'Oração' }} />
      <Tab.Screen name="Perfil" component={ProfileScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}
