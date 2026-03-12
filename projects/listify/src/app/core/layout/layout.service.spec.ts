import { TestBed } from '@angular/core/testing';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { of } from 'rxjs';
import { LayoutService } from './layout.service';

describe('LayoutService', () => {
  function setup(matches: boolean) {
    const mockBreakpointObserver = {
      observe: vi.fn().mockReturnValue(of({ matches, breakpoints: {} } as BreakpointState)),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: BreakpointObserver, useValue: mockBreakpointObserver }],
    });

    return {
      service: TestBed.inject(LayoutService),
      breakpointObserver: mockBreakpointObserver,
    };
  }

  it('should be created', () => {
    const { service } = setup(false);
    expect(service).toBeTruthy();
  });

  it('should have isMobile signal set to false on desktop', () => {
    const { service } = setup(false);
    expect(service.isMobile()).toBe(false);
  });

  it('should have isMobile signal set to true on mobile viewport', () => {
    const { service } = setup(true);
    expect(service.isMobile()).toBe(true);
  });

  it('should observe the correct breakpoint query', () => {
    const { breakpointObserver } = setup(false);
    expect(breakpointObserver.observe).toHaveBeenCalledWith('(max-width: 839.98px)');
  });
});
