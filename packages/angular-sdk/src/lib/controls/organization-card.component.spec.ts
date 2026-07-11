import { TestBed } from '@angular/core/testing';
import { IOrganization } from '@verdocs/js-sdk';
import { Component, signal } from '@angular/core';
import { VerdocsOrganizationCardComponent } from './organization-card.component';

const baseOrg: IOrganization = {
  id: 'org-1',
  name: 'Media Lantern',
  address: null,
  address2: null,
  phone: null,
  contact_email: null,
  parent_id: null,
  url: 'https://example.com',
  deletion_protected: false,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('VerdocsOrganizationCardComponent', () => {
  @Component({
    imports: [ VerdocsOrganizationCardComponent ],
    template: `<verdocs-organization-card [organization]="organization()" />`,
  })
  class HostComponent {
    organization = signal<IOrganization>(baseOrg);
  }

  it('renders the name and web site link', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Media Lantern');

    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a');
    expect(link.href).toBe('https://example.com/');
    expect(link.textContent).toContain('https://example.com');
  });

  it('falls back to a placeholder icon without a thumbnail, and shows one when set', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('svg')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('img')).toBeNull();

    fixture.componentInstance.organization.set({ ...baseOrg, thumbnail_url: 'https://example.com/logo.png' });
    fixture.detectChanges();

    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');
    expect(img.src).toBe('https://example.com/logo.png');
    expect(fixture.nativeElement.querySelector('svg')).toBeNull();
  });
});
