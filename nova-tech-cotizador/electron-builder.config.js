const path = require('path');

/** @type {import('electron-builder').Configuration} */
module.exports = {
  appId: 'com.teknotech.cotizador',
  productName: 'TeknoTech Services Cotizador',
  directories: {
    output: 'release',
    buildResources: 'assets',
  },
  files: [
    'dist/**/*',
    '.env',
    'assets/**/*',
    '!dist/win-unpacked/**/*',
    '!dist/*.exe',
    '!dist/*.blockmap',
    '!dist/*.yml',
    '!dist/.icon-ico/**/*',
    '!**/*.map',
  ],
  win: {
    target: 'nsis',
    icon: 'assets/logo-icon.png',
    artifactName: '${productName} Setup ${version}.${ext}',
  },
  mac: {
    target: 'dmg',
    icon: 'assets/logo-icon.png',
    artifactName: '${productName}-${version}-${arch}.${ext}',
  },
  linux: {
    target: 'AppImage',
    icon: 'assets/logo-icon.png',
    artifactName: '${productName}-${version}-${arch}.${ext}',
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
  },
  publish: {
    provider: 'github',
    owner: 'teknotechoficial',
    repo: 'nova-tech-cotizador',
  },
};
