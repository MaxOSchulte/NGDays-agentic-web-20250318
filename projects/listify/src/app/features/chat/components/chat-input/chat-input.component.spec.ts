import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ChatInputComponent } from './chat-input.component';

describe('ChatInputComponent', () => {
  let component: ChatInputComponent;
  let fixture: ComponentFixture<ChatInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatInputComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update messageText signal on input', () => {
    const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    textarea.value = 'Hello AI';
    textarea.dispatchEvent(new Event('input'));
    expect(component.messageText()).toBe('Hello AI');
  });

  it('should emit messageSent with trimmed text on send', () => {
    const emitted: string[] = [];
    component.messageSent.subscribe((msg: string) => emitted.push(msg));

    component.messageText.set('  Hello AI  ');
    component.send();

    expect(emitted).toEqual(['Hello AI']);
  });

  it('should clear input after send', () => {
    component.messageText.set('Hello AI');
    component.send();
    expect(component.messageText()).toBe('');
  });

  it('should not emit when message is empty', () => {
    const emitted: string[] = [];
    component.messageSent.subscribe((msg: string) => emitted.push(msg));

    component.messageText.set('   ');
    component.send();

    expect(emitted).toEqual([]);
  });

  it('should disable send button when input is empty', () => {
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('should enable send button when input has text', () => {
    component.messageText.set('Hello');
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.disabled).toBe(false);
  });

  it('should send on Enter without Shift', () => {
    const emitted: string[] = [];
    component.messageSent.subscribe((msg: string) => emitted.push(msg));
    component.messageText.set('Hello');

    const event = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: false });
    const spy = vi.spyOn(event, 'preventDefault');
    component.onEnter(event);

    expect(spy).toHaveBeenCalled();
    expect(emitted).toEqual(['Hello']);
  });

  it('should NOT send on Shift+Enter', () => {
    const emitted: string[] = [];
    component.messageSent.subscribe((msg: string) => emitted.push(msg));
    component.messageText.set('Hello');

    const event = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true });
    const spy = vi.spyOn(event, 'preventDefault');
    component.onEnter(event);

    expect(spy).not.toHaveBeenCalled();
    expect(emitted).toEqual([]);
  });

  it('should disable textarea and send button when disabled input is true', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    expect(textarea.disabled).toBe(true);
    expect(button.disabled).toBe(true);
  });
});
