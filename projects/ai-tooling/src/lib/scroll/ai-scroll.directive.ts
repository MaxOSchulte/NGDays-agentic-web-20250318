import {
  Directive,
  ElementRef,
  inject,
  input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { AiScrollService } from './ai-scroll.service';

@Directive({
  selector: '[aitScroll]',
  standalone: true,
})
export class AiScrollDirective implements OnInit, OnDestroy {
  private el = inject(ElementRef).nativeElement;
  private scrollService = inject(AiScrollService);

  private id = crypto.randomUUID();

  meta = input.required<string>({ alias: 'aiScroll' });

  constructor() {}

  ngOnInit(): void {
    this.scrollService.register(this.id, this.meta(), this);
  }

  ngOnDestroy(): void {
    this.scrollService.remove(this.id);
  }

  scrollTo(): void {
    this.el.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest',
    });
  }
}
