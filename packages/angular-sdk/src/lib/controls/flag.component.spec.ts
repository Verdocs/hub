import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { VerdocsFlagComponent } from './flag.component';

describe('VerdocsFlagComponent', () => {
  @Component({
    imports: [ VerdocsFlagComponent ],
    template: `
      <verdocs-flag
        [variant]="variant()"
        [showSkip]="true"
        (skip)="skips = skips + 1"
        (click)="clicks = clicks + 1" />
    `,
  })
  class HostComponent {
    skips = 0;
    clicks = 0;
    variant = signal<'fill' | 'next'>('fill');
  }

  it('renders the label and variant treatment on the host', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const flag: HTMLElement = fixture.nativeElement.querySelector('verdocs-flag');
    expect(flag.textContent).toContain('FILL');
    expect(flag.className).toContain('vdocs:w-[110px]');

    fixture.componentInstance.variant.set('next');
    fixture.detectChanges();
    expect(flag.className).toContain('vdocs:w-24');
  });

  it('emits skip without surfacing a body click', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const skipButton: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    skipButton.click();

    expect(fixture.componentInstance.skips).toBe(1);
    expect(fixture.componentInstance.clicks).toBe(0);
  });

  it('surfaces body clicks through the host element', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const body: HTMLElement = fixture.nativeElement.querySelector('verdocs-flag > div');
    body.click();

    expect(fixture.componentInstance.clicks).toBe(1);
    expect(fixture.componentInstance.skips).toBe(0);
  });
});
