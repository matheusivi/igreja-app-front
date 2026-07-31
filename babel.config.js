module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    // Reanimated 4 moveu os worklets para um pacote próprio — este plugin
    // TEM que ser o último da lista (ordem importa, ele processa por último).
    plugins: ['react-native-worklets/plugin'],
  };
};
