import { Router } from '@angular/router';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { VerdocsAuthComponent, type IAuthStatus } from '@verdocs/angular-sdk';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ VerdocsAuthComponent ],
  template: `
    <div class="login-wrap">
      <verdocs-auth (authenticated)="onAuthenticated($event)" />
    </div>
  `,
})
export class LoginComponent {
  private readonly router = inject(Router);

  onAuthenticated(status: IAuthStatus) {
    if (status.authenticated) {
      this.router.navigateByUrl('/dashboard', { replaceUrl: true }).catch(() => undefined);
    }
  }
}
