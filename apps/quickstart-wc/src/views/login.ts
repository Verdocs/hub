export const renderLogin = (outlet: HTMLElement) => {
  const wrap = document.createElement('div');
  wrap.className = 'login-wrap';

  // Navigation is not wired here on purpose: when vdocs-auth completes a
  // login it sets the session on the default endpoint, and the router's
  // session listener redirects to the dashboard.
  const auth = document.createElement('vdocs-auth');
  auth.addEventListener('vdocs-sdk-error', e => console.warn('SDK error', e.detail));

  wrap.append(auth);
  outlet.append(wrap);
};
