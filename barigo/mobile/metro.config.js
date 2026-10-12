const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// Solo observar la carpeta móvil, ignorando node_modules de los proyectos padre/hermanos
config.watchFolders = [projectRoot];
config.resolver.blockList = [
  new RegExp('^' + path.resolve(__dirname, '../../node_modules') + '/.*'),
  new RegExp('^' + path.resolve(__dirname, '../../client/node_modules') + '/.*'),
  new RegExp('^' + path.resolve(__dirname, '../backend/node_modules') + '/.*'),
  new RegExp('^' + path.resolve(__dirname, '../web/node_modules') + '/.*'),
];

module.exports = config;
