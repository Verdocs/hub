# Verdocs Angular Quickstart

A minimal Angular 22 app (standalone components, zoneless) showing the intended integration pattern for `@verdocs/angular-sdk`: a login route and an auth-guarded dashboard hosting the templates list.

## Run it

```bash
pnpm install
pnpm --filter @verdocs/angular-sdk build
pnpm --filter verdocs-quickstart-angular dev
```

The app talks to the beta environment (`https://stage-api.verdocs.com`) by default. Change the API base in [src/environments/environment.ts](src/environments/environment.ts), or add an angular.json fileReplacement for per-environment builds.

## What to look at

- [src/main.ts](src/main.ts): `provideVerdocs()` in the application providers, zoneless bootstrap
- [src/app/auth.guard.ts](src/app/auth.guard.ts): a route guard built on `VerdocsSessionService` signals
- [src/app/login.component.ts](src/app/login.component.ts): `<verdocs-auth>` with navigation on login
- [src/app/dashboard.component.ts](src/app/dashboard.component.ts): `<verdocs-templates-list>` with row-action outputs
