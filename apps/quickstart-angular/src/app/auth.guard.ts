import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { VerdocsSessionService } from '@verdocs/angular-sdk';

/**
 * Simple auth guard: provideVerdocs loads any persisted session synchronously
 * at startup, so the session state is already settled by the time routing runs.
 */
export const authGuard: CanActivateFn = () => {
  const session = inject(VerdocsSessionService);
  const router = inject(Router);

  return session.authenticated() ? true : router.parseUrl('/login');
};
