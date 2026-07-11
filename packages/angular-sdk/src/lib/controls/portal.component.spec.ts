import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { VerdocsPortalComponent } from './portal.component';

describe('VerdocsPortalComponent', () => {
  @Component({
    imports: [ VerdocsPortalComponent ],
    template: `
      <button #anchor class="anchor">Anchor</button>
      <button class="outside">Outside</button>
      <verdocs-portal [anchor]="anchor" (clickAway)="clickAways = clickAways + 1">
        <div class="portal-content">Portal Content</div>
      </verdocs-portal>
    `,
  })
  class HostComponent {
    clickAways = 0;
  }

  async function createFixture() {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  it('renders its content into document.body and removes it on destroy', async () => {
    const fixture = await createFixture();

    const content = document.querySelector('.portal-content') as HTMLElement;
    expect(content).not.toBeNull();
    expect(fixture.nativeElement.contains(content)).toBe(false);
    expect(content.closest('.vdocs-portal')?.parentElement).toBe(document.body);

    fixture.destroy();
    expect(document.querySelector('.portal-content')).toBeNull();
  });

  it('fires clickAway only for clicks outside the content and anchor', async () => {
    const fixture = await createFixture();

    (document.querySelector('.portal-content') as HTMLElement).click();
    (fixture.nativeElement.querySelector('.anchor') as HTMLElement).click();
    expect(fixture.componentInstance.clickAways).toBe(0);

    (fixture.nativeElement.querySelector('.outside') as HTMLElement).click();
    expect(fixture.componentInstance.clickAways).toBe(1);
  });

  it('positions the wrapper from the anchor rect', async () => {
    const fixture = await createFixture();

    const anchor: HTMLElement = fixture.nativeElement.querySelector('.anchor');
    anchor.getBoundingClientRect = () =>
      ({ top: 80, bottom: 100, left: 50, right: 90, width: 40, height: 20, x: 50, y: 80, toJSON: () => ({}) }) as DOMRect;

    // Repositioning listens for window events; resize is the simplest to fake.
    window.dispatchEvent(new Event('resize'));

    const wrapper = document.querySelector('.vdocs-portal') as HTMLElement;
    expect(wrapper.style.top).toBe('100px');
    expect(wrapper.style.left).toBe('50px');
  });
});
