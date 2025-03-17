import {
  computed,
  effect,
  inject,
  Injectable,
  Injector,
  Signal,
  signal,
} from '@angular/core';
import { registerInstance, unregisterInstance } from '../ai.service';
import { AiTool } from '../backend/ai-tool.decorator';

import { z } from 'zod';

const ClickTargetSchema = z.object({
  targetId: z.string().describe('ID of  the target that should be clicked.'),
});

export type ClickTarget = z.infer<typeof ClickTargetSchema>;

export interface AiClickTarget {
  guid: string;
  info: Signal<string>;
  instance: HTMLElement;
}

@Injectable({ providedIn: 'root' })
export class AiClickService {
  private readonly targets = signal<AiClickTarget[]>([]);

  private readonly metaInfo = computed(() => {
    const targetMap = this.targets().map(({ guid, info }) => [guid, info()]);
    return (
      '# Information about clickable targets as a map: ' +
      JSON.stringify(targetMap)
    );
  });

  constructor() {
    const injector = inject(Injector);
    const info = {
      className: AiClickService.name,
      metaInfo: this.metaInfo,
      instance: this,
    };

    effect(() => {
      if (this.targets().length) {
        registerInstance(info, injector);
      } else {
        unregisterInstance(info, injector);
      }
    });
  }

  register(target: AiClickTarget): void {
    this.targets.update((targets) => [...targets, target]);
  }

  deRegister(targetGuid: string): void {
    this.targets.update((targets) =>
      targets.filter(({ guid }) => guid !== targetGuid),
    );
  }

  @AiTool({
    description:
      'Clicks on a designated target. Available Targets are listed in the state info for the ' +
      AiClickService.name,
    parameters: ClickTargetSchema,
    // parameters: Object.values(zodToJsonSchema(ClickScema).definitions!)[0],
  })
  clickOn({ targetId }: ClickTarget): void {
    this.targets()
      .find(({ guid }) => guid === targetId)
      ?.instance?.click();
  }
}
