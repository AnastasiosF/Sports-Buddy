const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for symlinked packages (for your shared types)
config.watchFolders = [
  // Add the shared folder to watch for changes
  require('path').resolve(__dirname, '../../shared'),
];

// Improve resolver to handle local packages better
config.resolver.nodeModulesPaths = [
  require('path').resolve(__dirname, './node_modules'),
  require('path').resolve(__dirname, '../../node_modules'),
];

module.exports = config;
