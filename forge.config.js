module.exports = {
    packagerConfig: {
        packagerConfig: {
            icon: './assets/icons/icon' // no file extension required
        }
    },
    rebuildConfig: {},
    makers: [
        {
            name: '@electron-forge/maker-squirrel',
            config: {
              name: 'Turbo Tap Time',
              authors: 'Nicholas Dunn',
              description: 'A simple reaction time task for use in psychology research.'
              },
        },
        {
            name: '@electron-forge/maker-zip',
            platforms: ['darwin'],
        },
        {
            name: '@electron-forge/maker-deb',
            config: {},
        },
        {
            name: '@electron-forge/maker-rpm',
            config: {},
        },
    ],
};
