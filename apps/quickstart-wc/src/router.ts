import { VerdocsEndpoint } from '@verdocs/js-sdk';
import { renderDashboard } from './views/dashboard';
import { renderLogin } from './views/login';

type TRoute = '#/login' | '#/dashboard';

/**
 * Tiny hash router with a session guard. Hash routing keeps the demo free of
 * any server-side fallback configuration; a real app can swap in whatever
 * router it already uses, since the guard is nothing more than a session
 * listener on the endpoint.
 */
export const startRouter = (outlet: HTMLElement) => {
  const endpoint = VerdocsEndpoint.getDefault();
  let loaded = false;
  let rendered: TRoute | null = null;

  const render = () => {
    if (!loaded) {
      outlet.innerHTML = '<div class="loading-wrap"><vdocs-spinner mode="dark"></vdocs-spinner></div>';
      return;
    }

    const authenticated = !!endpoint.session;
    const requested: TRoute = window.location.hash.startsWith('#/login') ? '#/login' : '#/dashboard';
    const target: TRoute = authenticated ? requested === '#/login' ? '#/dashboard' : requested : '#/login';

    if (window.location.hash !== target) {
      window.location.hash = target; // the hashchange listener re-runs render
      return;
    }

    if (rendered !== target) {
      rendered = target;
      outlet.replaceChildren();
      if (target === '#/login') {
        renderLogin(outlet);
      } else {
        renderDashboard(outlet);
      }
    }
  };

  window.addEventListener('hashchange', render);

  // Session state drives routing: a completed login (or a sign-out) notifies
  // this listener and the guard above redirects accordingly.
  endpoint.onSessionChanged(() => {
    loaded = true;
    // rendered = null;
    render();
  });

  endpoint.loadSession();

  // loadSession() notifies synchronously when it finds nothing. If a session
  // was restored it notifies once the profile fetch completes, so leave the
  // loading state up until then.
  if (!loaded && !endpoint.session) {
    loaded = true;
  }

  render();
};
