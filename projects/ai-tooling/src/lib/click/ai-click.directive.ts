import {
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
} from '@angular/core';
import { AiClickService } from './ai-click.service';

@Directive({
  selector: '[aitClick]',
  standalone: true,
})
export class AiClickDirective {
  metaInfo = input.required<string>({ alias: 'aitClick' });

  constructor() {
    const guid = crypto.randomUUID();
    inject(DestroyRef).onDestroy(() => service.deRegister(guid));

    const service = inject(AiClickService);
    const element = inject(ElementRef);

    service.register({
      guid: guid,
      info: this.metaInfo,
      instance: element.nativeElement,
    });
  }
}
