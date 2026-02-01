const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Add polyfill for buffer
config.resolver = {
    ...config.resolver,
    extraNodeModules: {
        buffer: require.resolve("buffer/"),
    },
};

module.exports = withNativeWind(config, { input: "./global.css" });
