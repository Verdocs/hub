import { provideRouter } from '@angular/router';
import { provideVerdocs } from '@verdocs/angular-sdk';
import { provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { environment } from './environments/environment';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideVerdocs({ baseUrl: environment.apiBase }),
  ],
}).catch(error => console.error(error));
