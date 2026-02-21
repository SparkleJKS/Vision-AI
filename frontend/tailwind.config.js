const tokens = require('./src/theme/tailwindTokens.js');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './index.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        accent: tokens.accentYellow,
        screen: tokens.screenBg,
        card: tokens.cardBg,
        'card-light': tokens.cardBgLight,
        grey: tokens.grey,
        success: tokens.green,
        warning: tokens.warning,
        dark: tokens.darkBg,
        'tab-bar': tokens.tabBarBg,
        border: tokens.border,
      },
    },
  },
  plugins: [],
};
