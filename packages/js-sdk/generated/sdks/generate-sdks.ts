import {writeFileSync} from 'node:fs'
import { SdkPreamble } from './SdkPreamble'

const generateSdkDocs = async () => {
  
}

generateSdkDocs()
  .then(() => {
    console.log('Done generating SDK docs')
    writeFileSync('./sdk-docs.json', JSON.stringify(SdkPreamble, null, 2))
    process.exit(0)
  })
  .catch((e) => {
    console.log('[generate-sdks]: Error - ', e)
    process.exit(-1)
  });