module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['module:@react-native/babel-preset', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      [
        'module-resolver',
        {
          root: ['.'],
          extensions: ['.ts', '.tsx', '.android.tsx', '.ios.tsx'],
          alias: {
            '@': './src',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
