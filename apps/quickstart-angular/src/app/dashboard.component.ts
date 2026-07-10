import { Router } from '@angular/router';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { VerdocsButtonComponent, type ITemplateEvent, type SDKError } from '@verdocs/angular-sdk';
import { showToast, VerdocsSessionService, VerdocsTemplatesListComponent } from '@verdocs/angular-sdk';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ VerdocsTemplatesListComponent, VerdocsButtonComponent ],
  template: `
    <header class="app-header">
      <h1>Verdocs Angular Quickstart</h1>
      <div class="user">{{ userLabel() }}</div>
      <verdocs-button label="Sign Out" size="small" variant="outline" (click)="signOut()" />
    </header>

    <main class="app-main">
      <verdocs-templates-list
        (viewTemplate)="onViewTemplate($event)"
        (submittedData)="onSubmittedData($event)"
        (editTemplate)="onEditTemplate($event)"
        (sdkError)="onSdkError($event)" />
    </main>
  `,
})
export class DashboardComponent {
  private readonly session = inject(VerdocsSessionService);
  private readonly router = inject(Router);

  readonly userLabel = computed(() => {
    const profile = this.session.profile();
    return profile ? `${profile.first_name} ${profile.last_name} (${profile.email})` : '';
  });

  signOut() {
    this.session.signOut();
    this.router.navigateByUrl('/login', { replaceUrl: true }).catch(() => undefined);
  }

  onViewTemplate(event: ITemplateEvent) {
    showToast(`View template: ${event.template.name}`, { style: 'info' });
  }

  onSubmittedData(event: ITemplateEvent) {
    showToast(`Submissions for: ${event.template.name}`, { style: 'info' });
  }

  onEditTemplate(event: ITemplateEvent) {
    showToast(`Edit template: ${event.template.name}`, { style: 'info' });
  }

  onSdkError(error: SDKError) {
    showToast(error.message, { style: 'error' });
  }
}
