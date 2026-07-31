import { LogBox } from 'react-native';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';

/**
 * Silencia um aviso falso-positivo do Reanimated.
 *
 * O aviso "you might be using shared value's .value inside reanimated inline
 * style" não vem do nosso código — nenhuma tela nossa usa shared values. Vem
 * do runtime do NativeWind, que usa Reanimated por baixo para resolver as
 * classes do Tailwind e lê esses valores durante o render.
 *
 * O NativeWind v4 com Reanimated v4 é uma combinação com fricção conhecida
 * (ver github.com/nativewind/nativewind/discussions/1529). Desde o Reanimated
 * 3.16 o modo "strict" do log vem ligado por padrão e passou a acusar isso.
 *
 * Duas camadas de defesa, porque só a primeira não bastou:
 * 1. desligar o strict no logger;
 * 2. ignorar a mensagem específica no LogBox.
 *
 * Importante: é puramente cosmético e só afeta desenvolvimento — LogBox não
 * existe em build de produção. Nada de funcionalidade é desligado aqui.
 */
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

LogBox.ignoreLogs([
  "It looks like you might be using shared value's .value inside reanimated inline style",
]);
