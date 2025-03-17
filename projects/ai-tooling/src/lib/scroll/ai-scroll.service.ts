import { computed, Injectable, signal } from '@angular/core';
import { z } from 'zod';
import { registerInstance } from '../ai.service';
import { AiTool } from '../backend/ai-tool.decorator';
import { AiScrollDirective } from './ai-scroll.directive';

const ScrollTartetSchema = z.object({
  id: z.string().describe('Given id of the target to scroll to'),
});

export type ScrollTarget = z.infer<typeof ScrollTartetSchema>;

@Injectable({
  providedIn: 'root',
})
export class AiScrollService {
  state = signal<Record<string, { meta: string; instance: AiScrollDirective }>>(
    {},
  );

  constructor() {
    registerInstance({
      className: AiScrollService.name,
      state: computed(() =>
        JSON.stringify({
          scrollableTargets: {
            description:
              'Available elements to scroll to identified by an id and a description',
            targets: Object.fromEntries(
              Object.entries(this.state()).map(([id, { meta }]) => [id, meta]),
            ),
          },
        }),
      ),
      instance: this,
    });
  }

  /**
   * Registers an instance of AiScrollDirective with a given id, meta string, and associated directive reference.
   *
   * @param id A unique identifier for the registered instance
   * @param meta Additional metadata associated with the instance (e.g., description, keywords)
   * @param instance The actual AiScrollDirective instance to be associated with the given id and metadata
   */
  register(id: string, meta: string, instance: AiScrollDirective): void {
    this.state.update((state) => ({ ...state, [id]: { meta, instance } }));
  }

  remove(id: string): void {
    this.state.update((state) =>
      Object.fromEntries(
        Object.entries(state).filter(([stateId]) => id !== stateId),
      ),
    );
  }

  /**
   * Get a Map of scroll target Ids. Map key is the target ID  and Value is the description of the target.
   */
  @AiTool({
    description:
      'Get a Map of scroll target Ids. Map key is the target ID  and Value is the description of the target.',
  })
  getScrollTargets(): Record<string, string> {
    return Object.fromEntries(
      Object.entries(this.state()).map(([id, { meta }]) => [id, meta]),
    );
  }

  /**
   * Scrolls to a given element identified by an id. Use this function to scroll an elmenet into view. e.g. when the
   * user asks: "Scroll the conference XXXX into view"
   *
   * Important: this function only scrolls to an known element.
   */
  @AiTool({
    description: `
    Scrolls to a given element identified by an id. Use this function to scroll an elmenet into view. e.g. when the
    user asks: "Scroll the conference XXXX into view"

    Important: this function only scrolls to an known element.`,
    parameters: ScrollTartetSchema,
  })
  scrollTo({ id }: ScrollTarget): void {
    this.state()[id].instance.scrollTo();
  }
}
