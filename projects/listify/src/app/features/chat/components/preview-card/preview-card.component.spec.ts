import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Component, input } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PreviewCardComponent } from './preview-card.component';
import { ListService } from '../../../../core/services/list.service';
import { PreviewChatMessage } from '../../../../core/models/index';

describe('PreviewCardComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let listService: ListService;
  let router: Router;

  const createMessage = (listName: string): PreviewChatMessage => ({
    id: 'msg-1',
    type: 'preview',
    listName,
    timestamp: new Date().toISOString(),
  });

  @Component({
    imports: [PreviewCardComponent],
    template: `<app-preview-card [message]="message()" />`,
  })
  class TestHostComponent {
    readonly message = input.required<PreviewChatMessage>();
  }

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [TestHostComponent, NoopAnimationsModule],
      providers: [{ provide: Router, useValue: { navigate: vi.fn() } }],
    });
    listService = TestBed.inject(ListService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    localStorage.clear();
  });

  function createComponent(listName: string): ComponentFixture<TestHostComponent> {
    fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentRef.setInput('message', createMessage(listName));
    fixture.detectChanges();
    return fixture;
  }

  it('should render list name and progress when list exists', () => {
    const list = listService.createList('Groceries');
    listService.addItem(list.name, 'Milk');
    listService.addItem(list.name, 'Eggs');
    createComponent(list.name);

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Groceries');
    expect(el.textContent).toContain('0 / 2');
  });

  it('should show "This list was deleted" when list does not exist', () => {
    createComponent('nonexistent-list');

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('This list was deleted');
  });

  it('should show first 5 items by default', () => {
    const list = listService.createList('Big List');
    for (let i = 1; i <= 7; i++) {
      listService.addItem(list.name, `Item ${i}`);
    }
    createComponent(list.name);

    const el: HTMLElement = fixture.nativeElement;
    const checkboxes = el.querySelectorAll('.preview-item');
    expect(checkboxes.length).toBe(5);
    expect(el.textContent).toContain('Show all 7 items');
  });

  it('should expand to show all items when expand button is clicked', () => {
    const list = listService.createList('Big List');
    for (let i = 1; i <= 7; i++) {
      listService.addItem(list.name, `Item ${i}`);
    }
    createComponent(list.name);

    const el: HTMLElement = fixture.nativeElement;
    const expandBtn = el.querySelector('.expand-toggle') as HTMLButtonElement;
    expandBtn.click();
    fixture.detectChanges();

    const items = el.querySelectorAll('.preview-item');
    expect(items.length).toBe(7);
  });

  it('should call ListService.toggleItem when checkbox is toggled', () => {
    const list = listService.createList('Test');
    const item = listService.addItem(list.name, 'Task 1');
    const toggleSpy = vi.spyOn(listService, 'toggleItem');
    createComponent(list.name);

    const el: HTMLElement = fixture.nativeElement;
    const checkbox = el.querySelector('mat-checkbox') as HTMLElement;
    const checkboxInput = checkbox.querySelector('input') as HTMLInputElement;
    checkboxInput.click();
    fixture.detectChanges();

    expect(toggleSpy).toHaveBeenCalledWith(list.name, item.text);
  });

  it('should navigate to list detail when navigate button is clicked', () => {
    const list = listService.createList('Navigate Me');
    createComponent(list.name);

    const el: HTMLElement = fixture.nativeElement;
    const navBtn = el.querySelector('.open-list-btn') as HTMLButtonElement;
    navBtn.click();

    expect(router.navigate).toHaveBeenCalledWith(['/tasks', encodeURIComponent(list.name)]);
  });
});
