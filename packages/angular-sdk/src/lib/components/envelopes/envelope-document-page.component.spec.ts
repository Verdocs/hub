import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { VerdocsEnvelopeDocumentPageComponent } from './envelope-document-page.component';

describe('VerdocsEnvelopeDocumentPageComponent', () => {
  @Component({
    imports: [ VerdocsEnvelopeDocumentPageComponent ],
    template: `
      <verdocs-envelope-document-page
        [pageImageUri]="pageImageUri()"
        [virtualWidth]="virtualWidth()"
        [virtualHeight]="virtualHeight()"
        [pageNumber]="pageNumber()">
        <div data-testid="field" style="position: absolute; left: 100px; bottom: 200px">Field</div>
      </verdocs-envelope-document-page>
    `,
  })
  class HostComponent {
    pageImageUri = signal<string | undefined>(undefined);
    virtualWidth = signal(612);
    virtualHeight = signal(792);
    pageNumber = signal(1);
  }

  it('renders the page image when a URI is provided', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.pageImageUri.set('https://fake.test/page-3.png');
    fixture.componentInstance.pageNumber.set(3);
    fixture.detectChanges();

    const image: HTMLImageElement = fixture.nativeElement.querySelector('img');
    expect(image.getAttribute('src')).toBe('https://fake.test/page-3.png');
    expect(image.getAttribute('alt')).toBe('Page 3');
    expect(fixture.nativeElement.querySelector('[data-testid="page-placeholder"]')).toBeNull();
  });

  it('renders a placeholder while the page image is missing', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="page-placeholder"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
  });

  it('sizes the host from the page dimensions', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.pageImageUri.set('https://fake.test/page-1.png');
    fixture.componentInstance.virtualWidth.set(500);
    fixture.componentInstance.virtualHeight.set(1000);
    fixture.detectChanges();

    const host: HTMLElement = fixture.nativeElement.querySelector('verdocs-envelope-document-page');
    expect(host.style.aspectRatio).toBe('500 / 1000');
  });

  it('lays the field layer out at the virtual page size so children keep PDF coordinates', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.pageImageUri.set('https://fake.test/page-1.png');
    fixture.detectChanges();

    const child: HTMLElement = fixture.nativeElement.querySelector('[data-testid="field"]');
    expect(child.style.left).toBe('100px');
    expect(child.style.bottom).toBe('200px');

    // jsdom reports zero widths, so the layer stays at the unmeasured 1:1 scale.
    const layer = child.parentElement as HTMLElement;
    expect(layer.style.width).toBe('612px');
    expect(layer.style.height).toBe('792px');
    expect(layer.style.transform).toBe('scale(1)');
    expect(layer.style.transformOrigin).toBe('top left');
  });
});
