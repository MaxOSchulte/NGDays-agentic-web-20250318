import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-toolbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatToolbarModule],
  template: `
    <mat-toolbar>
      <span>{{ title() }}</span>
    </mat-toolbar>
  `,
  styles: `
    :host {
      background: var(--mat-sys-surface-container-low);
      display: block;
    }
  `,
})
export class ToolbarComponent {
  readonly title = input<string>('Listify');
}
