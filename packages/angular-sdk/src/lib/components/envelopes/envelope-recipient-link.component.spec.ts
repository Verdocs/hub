import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import type { IRecipient } from '@verdocs/js-sdk';
import { VerdocsEnvelopeRecipientLinkComponent } from './envelope-recipient-link.component';

const recipient = {
  role_name: 'Signer 1',
  first_name: 'Paige',
  last_name: 'Turner',
  email: 'paige.turner@example.com',
} as IRecipient;

describe('VerdocsEnvelopeRecipientLinkComponent', () => {
  @Component({
    imports: [ VerdocsEnvelopeRecipientLinkComponent ],
    template: `
      <verdocs-envelope-recipient-link
        [recipient]="recipient()"
        [link]="link()"
        [gettingLink]="gettingLink()"
        (getLink)="requested.push($event)"
        (done)="dones = dones + 1" />
    `,
  })
  class HostComponent {
    recipient = signal<IRecipient>(recipient);
    link = signal<string | undefined>(undefined);
    gettingLink = signal(false);
    requested: IRecipient[] = [];
    dones = 0;
  }

  let writeText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // jsdom has no clipboard; the component only needs writeText.
    writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  });

  afterEach(() => {
    document.querySelectorAll('.vdocs-toast').forEach(toast => toast.remove());
  });

  const render = () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return fixture;
  };

  const buttonByLabel = (fixture: { nativeElement: HTMLElement }, label: string) =>
    Array.from(fixture.nativeElement.querySelectorAll<HTMLButtonElement>('button')).find(
      button => button.textContent?.trim() === label) as HTMLButtonElement;

  it('renders the recipient role, name, and email', () => {
    const fixture = render();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Signer 1');
    expect(text).toContain('Paige Turner (paige.turner@example.com)');
  });

  it('falls back to the phone number when the recipient has no email', () => {
    const fixture = render();
    fixture.componentInstance.recipient.set({ ...recipient, email: '', phone: '+15555550123' } as IRecipient);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Paige Turner (+15555550123)');
  });

  it('requests the link through getLink and shows a loading state while fetching', () => {
    const fixture = render();

    buttonByLabel(fixture, 'Get Link').click();
    expect(fixture.componentInstance.requested).toEqual([ recipient ]);

    fixture.componentInstance.gettingLink.set(true);
    fixture.detectChanges();
    expect(buttonByLabel(fixture, 'Loading...').disabled).toBe(true);
  });

  it('shows the link and copies it to the clipboard', async () => {
    const fixture = render();
    fixture.componentInstance.link.set('https://sign.fake.test/abc');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('https://sign.fake.test/abc');
    expect(buttonByLabel(fixture, 'Get Link')).toBeUndefined();

    buttonByLabel(fixture, 'Copy').click();
    await fixture.whenStable();
    expect(writeText).toHaveBeenCalledWith('https://sign.fake.test/abc');
  });

  it('fires done when Done is clicked', () => {
    const fixture = render();

    buttonByLabel(fixture, 'Done').click();
    expect(fixture.componentInstance.dones).toBe(1);
  });
});
