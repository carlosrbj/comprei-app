/**
 * react-native-worklets is required by react-native-reanimated as a JS module,
 * but its native Android code asserts React Native >= 0.79. Since we're on
 * RN 0.76.x (Expo SDK 52), we exclude it from native autolinking.
 * Reanimated 3.16.x bundles its own worklets implementation natively.
 */
module.exports = {
  dependencies: {
    'react-native-worklets': {
      platforms: {
        android: null,
        ios: null,
      },
    },
  },
};
