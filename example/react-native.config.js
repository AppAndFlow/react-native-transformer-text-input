const path = require('path');
const pkg = require('../package.json');
const workletsPackage = require('../node_modules/react-native-worklets/package.json');

module.exports = {
  project: {
    ios: {
      automaticPodsInstallation: true,
    },
  },
  dependencies: {
    [pkg.name]: {
      root: path.join(__dirname, '..'),
    },
    [workletsPackage.name]: {
      root: path.join(__dirname, '../node_modules/react-native-worklets'),
    },
  },
};
