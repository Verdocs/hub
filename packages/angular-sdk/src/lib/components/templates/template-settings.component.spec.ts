import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import type { ITemplate } from '@verdocs/js-sdk';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { VerdocsTemplateSettingsComponent } from './template-settings.component';
import type { ITemplateEvent, SDKError } from '../../types';
import { provideVerdocs } from '../../provide-verdocs';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const makeTemplate = (overrides: Partial<ITemplate> = {}): ITemplate =>
  ({
    id: 'template-1',
    name: 'Lease Agreement',
    visibility: 'private',
    sender: 'envelope_creator',
    initial_reminder: null,
    followup_reminders: null,
    roles: [],
    fields: [],
    documents: [],
    ...overrides,
  }) as unknown as ITemplate;

// The save handler chains promises the pending-task tracker cannot see, so
// settle the tracker and the microtask queue a few times before asserting.
async function settle(fixture: ComponentFixture<unknown>) {
  for (let i = 0; i < 5; i++) {
    await fixture.whenStable();
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  fixture.detectChanges();
}

describe('VerdocsTemplateSettingsComponent', () => {
  @Component({
    imports: [ VerdocsTemplateSettingsComponent ],
    template: `
      <verdocs-template-settings
        [templateId]="templateId()"
        (settingsChanged)="changes.push($event)"
        (sdkError)="errors.push($event)"
        (cancel)="cancels = cancels + 1" />
    `,
  })
  class HostComponent {
    changes: ITemplateEvent[] = [];
    errors: SDKError[] = [];
    cancels = 0;
    templateId = signal('template-1');
  }

  let mock: MockAdapter;

  beforeEach(() => {
    localStorage.clear();

    mock = new MockAdapter(axios);
    mock.onGet('/v2/templates/template-1').reply(200, makeTemplate());

    TestBed.configureTestingModule({
      providers: [ provideVerdocs({ baseUrl: 'https://stage-api.verdocs.com' }) ],
    });
  });

  afterEach(() => {
    mock.restore();
    document.querySelectorAll('.vdocs-toast').forEach(toast => toast.remove());
  });

  const render = async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await settle(fixture);
    return fixture;
  };

  const element = (fixture: ComponentFixture<HostComponent>) => fixture.nativeElement as HTMLElement;

  const buttonByLabel = (fixture: ComponentFixture<HostComponent>, label: string) =>
    Array.from(element(fixture).querySelectorAll<HTMLButtonElement>('verdocs-button button')).find(
      button => button.textContent?.trim() === label) as HTMLButtonElement;

  const inputByPlaceholder = (fixture: ComponentFixture<HostComponent>, placeholder: string) =>
    element(fixture).querySelector(`input[placeholder="${placeholder}"]`) as HTMLInputElement;

  const setInputValue = (input: HTMLInputElement, value: string) => {
    input.value = value;
    input.dispatchEvent(new Event('input'));
  };

  const setSelectValue = (fixture: ComponentFixture<HostComponent>, index: number, value: string) => {
    const select = element(fixture).querySelectorAll('select')[index] as HTMLSelectElement;
    select.value = value;
    select.dispatchEvent(new Event('change'));
  };

  it('loads the current settings into the form', async () => {
    const fixture = await render();

    expect(inputByPlaceholder(fixture, 'Template Name...').value).toBe('Lease Agreement');

    const selects = element(fixture).querySelectorAll('select');
    expect((selects[0] as HTMLSelectElement).value).toBe('private');
    expect((selects[1] as HTMLSelectElement).value).toBe('envelope_creator');

    const reminders = element(fixture).querySelector('input[role="switch"]') as HTMLInputElement;
    expect(reminders.checked).toBe(false);
    expect(buttonByLabel(fixture, 'Save').disabled).toBe(true);
  });

  it('saves edits and reports the updated template', async () => {
    const updated = makeTemplate({ name: 'Renamed' });
    mock.onPatch('/v2/templates/template-1').reply(200, updated);

    const fixture = await render();

    setInputValue(inputByPlaceholder(fixture, 'Template Name...'), 'Renamed');
    setSelectValue(fixture, 0, 'shared');
    fixture.detectChanges();

    buttonByLabel(fixture, 'Save').click();
    await settle(fixture);

    const request = mock.history.patch.find(r => r.url === '/v2/templates/template-1');
    expect(JSON.parse(request?.data as string)).toEqual({
      name: 'Renamed',
      visibility: 'shared',
      sender: 'envelope_creator',
      initial_reminder: null,
      followup_reminders: null,
    });

    expect(fixture.componentInstance.changes).toEqual([ expect.objectContaining({ template: updated }) ]);
  });

  it('converts reminder days to milliseconds when reminders are enabled', async () => {
    mock.onPatch('/v2/templates/template-1').reply(200, makeTemplate());

    const fixture = await render();

    const reminders = element(fixture).querySelector('input[role="switch"]') as HTMLInputElement;
    reminders.click();
    fixture.detectChanges();

    const dayInputs = element(fixture).querySelectorAll('input[placeholder="Delay in days..."]');
    setInputValue(dayInputs[0] as HTMLInputElement, '3');
    fixture.detectChanges();

    buttonByLabel(fixture, 'Save').click();
    await settle(fixture);

    const request = mock.history.patch.find(r => r.url === '/v2/templates/template-1');
    expect(JSON.parse(request?.data as string)).toEqual(
      expect.objectContaining({ initial_reminder: 3 * MS_PER_DAY, followup_reminders: 0 }),
    );
  });

  it('fires cancel when the user cancels', async () => {
    const fixture = await render();

    buttonByLabel(fixture, 'Cancel').click();

    expect(fixture.componentInstance.cancels).toBe(1);
    expect(mock.history.patch).toEqual([]);
  });

  it('reports load errors and shows the error state', async () => {
    mock.onGet('/v2/templates/template-1').reply(404, { error: 'not found' });

    const fixture = await render();

    expect(element(fixture).querySelector('[role="alert"]')?.textContent).toContain('Unable to load this template');
    expect(fixture.componentInstance.errors).toEqual([ expect.objectContaining({ statusCode: 404 }) ]);
  });
});
