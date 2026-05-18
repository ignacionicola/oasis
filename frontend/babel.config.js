module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // react-native-worklets/plugin debe ir SIEMPRE último.
    // Requerido por react-native-reanimated v4.
    plugins: ['react-native-worklets/plugin'],
  };
};
