import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { VerdocsMenuPanelComponent } from './menu-panel.component';

describe('VerdocsMenuPanelComponent', () => {
  @Component({
    imports: [ VerdocsMenuPanelComponent ],
    template: `
      @if (open()) {
        <verdocs-menu-panel [side]="side()" [width]="250" (close)="closes = closes + 1">
          <div class="panel-content">Panel Content</div>
        </verdocs-menu-panel>
      }
    `,
  })
  class HostComponent {
    open = signal(true);
    side = signal<'left' | 'right'>('right');
    closes = 0;
  }

  async function createFixture() {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  it('renders the panel and overlay into document.body and unmounts cleanly', async () => {
    const fixture = await createFixture();

    const panel = document.querySelector('.vdocs-menu-panel') as HTMLElement;
    expect(panel.getAttribute('role')).toBe('dialog');
    expect(panel.style.width).toBe('250px');
    expect(panel.textContent).toContain('Panel Content');
    expect(panel.className).toContain('vdocs:right-0');
    expect(fixture.nativeElement.contains(panel)).toBe(false);
    expect(document.querySelector('.vdocs-menu-panel-overlay')).not.toBeNull();

    fixture.componentInstance.open.set(false);
    fixture.detectChanges();
    expect(document.querySelector('.vdocs-menu-panel')).toBeNull();
    expect(document.querySelector('.vdocs-menu-panel-overlay')).toBeNull();
  });

  it('slides in from the left when requested', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.side.set('left');
    fixture.detectChanges();
    await fixture.whenStable();

    const panel = document.querySelector('.vdocs-menu-panel') as HTMLElement;
    expect(panel.className).toContain('vdocs:left-0');
  });

  it('emits close only for clicks outside the panel', async () => {
    const fixture = await createFixture();

    (document.querySelector('.panel-content') as HTMLElement).click();
    expect(fixture.componentInstance.closes).toBe(0);

    document.body.click();
    expect(fixture.componentInstance.closes).toBe(1);
  });
});
