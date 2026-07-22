import { showToast } from '@verdocs/wc-sdk';
import { VerdocsEndpoint } from '@verdocs/js-sdk';

export const renderDashboard = (outlet: HTMLElement) => {
  const endpoint = VerdocsEndpoint.getDefault();
  const profile = endpoint.profile;

  const header = document.createElement('header');
  header.className = 'app-header';

  const title = document.createElement('h1');
  title.textContent = 'Verdocs WC Quickstart';

  const user = document.createElement('div');
  user.className = 'user';
  user.textContent = profile ? `${profile.first_name} ${profile.last_name} (${profile.email})` : '';

  // Clearing the session notifies the router's guard, which redirects to /login.
  const signOut = document.createElement('vdocs-button');
  signOut.label = 'Sign Out';
  signOut.size = 'small';
  signOut.variant = 'outline';
  signOut.addEventListener('click', () => endpoint.clearSession());

  header.append(title, user, signOut);

  const main = document.createElement('main');
  main.className = 'app-main';

  const list = document.createElement('vdocs-templates-list');
  list.addEventListener('vdocs-view-template', e => showToast(`View template: ${e.detail.template.name}`, { style: 'info' }));
  list.addEventListener('vdocs-submitted-data', e => showToast(`Submissions for: ${e.detail.template.name}`, { style: 'info' }));
  list.addEventListener('vdocs-edit-template', e => showToast(`Edit template: ${e.detail.template.name}`, { style: 'info' }));
  list.addEventListener('vdocs-sdk-error', e => showToast(e.detail.message, { style: 'error' }));
  main.append(list);

  outlet.append(header, main);
};
