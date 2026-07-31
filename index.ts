// Primeiríssimo import: precisa rodar antes de qualquer código do Reanimated,
// e o gesture-handler já puxa o Reanimated junto.
import './src/config/reanimated';
import 'react-native-gesture-handler';

import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
