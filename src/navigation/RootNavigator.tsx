import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useThemeColors } from '../hooks/useThemeColors';
import { AppStack } from './AppStack';
import { AuthProvider, useAuth } from './AuthContext';
import { AuthStack } from './AuthStack';

function RootSwitch() {
  const colors = useThemeColors();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  return isAuthenticated ? <AppStack /> : <AuthStack />;
}

export function RootNavigator() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootSwitch />
      </NavigationContainer>
    </AuthProvider>
  );
}
