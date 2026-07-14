import pkg from '../../package.json'

export const SdkPreamble = {
  info: {
    title: 'Verdocs Platform SDKs',
    version: pkg.version,
    description: 'Verdocs native SDKs',
    termsOfService: 'https://verdocs.com/en/eula/',
    license: {name: 'MIT', url: 'https://opensource.org/licenses/MIT'},
    contact: {
      name: 'Verdocs Support',
      url: 'https://verdocs.com/en/contact/',
      email: 'support@verdocs.com',
    },
  },
  sdks: {
    'typescript': {
      id: '',
      name: '',
      summary: '',
      symbol: '',
      functions: {
        'getNotifications': {
          name: 'getNotifications',
          description: '',
          sample: `...code...`,
          params: {}
        }
      }
    }
  }
}