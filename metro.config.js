const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Use private import as metro-config exports are restricted
const exclusionList = require("metro-config/private/defaults/exclusionList").default;

// Add polyfill for buffer
config.resolver = {
    ...config.resolver,
    extraNodeModules: {
        buffer: require.resolve("buffer/"),
    },
    blacklistRE: exclusionList([/QIKBackend\/.*/]),
};

module.exports = withNativeWind(config, { input: "./global.css" });
