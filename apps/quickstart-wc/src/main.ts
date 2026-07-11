import '@verdocs/wc-sdk';
import '@verdocs/wc-sdk/styles.css';
import { VerdocsEndpoint } from '@verdocs/js-sdk';
import { startRouter } from './router';
import './app.css';

// Beta by default; point elsewhere with VITE_VERDOCS_API_BASE.
const apiBase = import.meta.env.VITE_VERDOCS_API_BASE || 'https://stage-api.verdocs.com';

// The web components have no provider tree; the default endpoint singleton
// is how an app supplies its configuration once for every component.
new VerdocsEndpoint({ baseURL: apiBase }).setDefault();

startRouter(document.getElementById('app')!);
