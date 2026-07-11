import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import type { ITemplate } from '@verdocs/js-sdk';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { VerdocsTemplateCreateComponent } from './template-create.component';
import { provideVerdocs } from '../../provide-verdocs';
import type { SDKError } from '../../types';

const pdf = (name: string) => new File([ '%PDF-1.4' ], name, { type: 'application/pdf' });

function pickFiles(input: HTMLInputElement, files: File[]) {
  Object.defineProperty(input, 'files', { value: files, configurable: true });
  input.dispatchEvent(new Event('change'));
}

const created = { id: 't-new', name: 'Lease.pdf' } as ITemplate;

// The create handler chains promises the pending-task tracker cannot see, so
// settle the tracker and the microtask queue a few times before asserting.
async function settle(fixture: ComponentFixture<unknown>) {
  for (let i = 0; i < 5; i++) {
    await fixture.whenStable();
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  fixture.detectChanges();
}

describe('VerdocsTemplateCreateComponent', () => {
  @Component({
    imports: [ VerdocsTemplateCreateComponent ],
    template: `
      <verdocs-template-create
        [maxSize]="maxSize()"
        (templateCreated)="createdTemplates.push($event)"
        (sdkError)="errors.push($event)"
        (cancel)="cancels = cancels + 1" />
    `,
  })
  class HostComponent {
    createdTemplates: ITemplate[] = [];
    errors: SDKError[] = [];
    cancels = 0;
    maxSize = signal(20.5 * 1024 * 1024);
  }

  let mock: MockAdapter;

  beforeEach(() => {
    localStorage.clear();

    mock = new MockAdapter(axios);
    mock.onPost('/v2/templates').reply(200, created);

    TestBed.configureTestingModule({
      providers: [ provideVerdocs({ baseUrl: 'https://stage-api.verdocs.com' }) ],
    });
  });

  afterEach(() => {
    mock.restore();
  });

  const render = () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return fixture;
  };

  const buttonByLabel = (fixture: ComponentFixture<HostComponent>, label: string) =>
    Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('verdocs-button button')).find(
      button => button.textContent?.trim() === label) as HTMLButtonElement;

  const nameInput = (fixture: ComponentFixture<HostComponent>) =>
    fixture.nativeElement.querySelector('input[type="text"]') as HTMLInputElement;

  const typeName = (fixture: ComponentFixture<HostComponent>, value: string) => {
    const input = nameInput(fixture);
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  const chooseFile = (fixture: ComponentFixture<HostComponent>, file: File) => {
    pickFiles(fixture.nativeElement.querySelector('input[type="file"]'), [ file ]);
    fixture.detectChanges();
  };

  it('disables Create until a file is chosen, then prefills the name', () => {
    const fixture = render();

    expect(buttonByLabel(fixture, 'Create').disabled).toBe(true);

    chooseFile(fixture, pdf('Lease.pdf'));

    expect(nameInput(fixture).value).toBe('Lease.pdf');
    expect(buttonByLabel(fixture, 'Create').disabled).toBe(false);
  });

  it('keeps a name the user typed when a file is chosen later', () => {
    const fixture = render();

    typeName(fixture, 'Rental Agreement');
    chooseFile(fixture, pdf('Lease.pdf'));

    expect(nameInput(fixture).value).toBe('Rental Agreement');
  });

  it('creates the template and reports it through templateCreated', async () => {
    const fixture = render();

    const file = pdf('Lease.pdf');
    chooseFile(fixture, file);
    buttonByLabel(fixture, 'Create').click();
    await settle(fixture);

    expect(fixture.componentInstance.createdTemplates).toEqual([ created ]);

    const request = mock.history.post.find(r => r.url === '/v2/templates');
    const body = request?.data as FormData;
    expect(body.get('name')).toBe('Lease.pdf');
    expect(body.getAll('documents')).toEqual([ file ]);
  });

  it('disables the form while the create is pending', async () => {
    let resolveCreate!: (value: [number, ITemplate]) => void;
    mock.onPost('/v2/templates').reply(() => new Promise(resolve => {
      resolveCreate = resolve;
    }));

    const fixture = render();
    chooseFile(fixture, pdf('Lease.pdf'));
    buttonByLabel(fixture, 'Create').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Creating template...');
    expect(buttonByLabel(fixture, 'Create').disabled).toBe(true);
    expect(buttonByLabel(fixture, 'Cancel').disabled).toBe(true);
    expect(nameInput(fixture).disabled).toBe(true);
    expect(fixture.componentInstance.createdTemplates).toEqual([]);

    resolveCreate([ 200, created ]);
    await settle(fixture);

    expect(fixture.componentInstance.createdTemplates).toEqual([ created ]);
    expect(buttonByLabel(fixture, 'Cancel').disabled).toBe(false);
  });

  it('reports failures through sdkError', async () => {
    mock.onPost('/v2/templates').reply(400, { code: 'invalid' });

    const fixture = render();
    chooseFile(fixture, pdf('Lease.pdf'));
    buttonByLabel(fixture, 'Create').click();
    await settle(fixture);

    expect(fixture.componentInstance.createdTemplates).toEqual([]);
    expect(fixture.componentInstance.errors).toEqual([
      expect.objectContaining({ statusCode: 400, response: { code: 'invalid' } }),
    ]);
  });

  it('shows the size error and blocks submit for oversized files', () => {
    const fixture = render();
    fixture.componentInstance.maxSize.set(4);
    fixture.detectChanges();

    chooseFile(fixture, pdf('Lease.pdf'));

    expect(fixture.nativeElement.textContent).toContain('Total file size must not exceed 20MB.');
    expect(buttonByLabel(fixture, 'Create').disabled).toBe(true);
  });

  it('fires cancel when the user cancels', () => {
    const fixture = render();

    buttonByLabel(fixture, 'Cancel').click();

    expect(fixture.componentInstance.cancels).toBe(1);
    expect(mock.history.post.filter(request => request.url === '/v2/templates')).toEqual([]);
  });
});
