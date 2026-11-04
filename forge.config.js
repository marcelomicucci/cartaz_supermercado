module.exports = {
  packagerConfig: {
    asar: true,
    executableName: "CartazFacil",
    ignore: [
      /^\/\.github/,
      /^\/docs/,
      /^\/scripts/,
      /^\/out/,
      /^\/(CONTRIBUTING|README|SECURITY)\.md$/,
      /^\/LICENSE$/,
      /^\/forge\.config\.js$/,
      /^\/package-lock\.json$/
    ]
  },
  rebuildConfig: {},
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "CartazFacil",
        setupExe: "CartazFacil-Setup.exe",
        setupIcon: undefined,
        noMsi: true
      }
    }
  ]
};
