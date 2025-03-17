import { TitleCasePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDividerModule } from '@angular/material/divider';

type FilterType = 'all' | 'active' | 'completed';

@Component({
  selector: 'app-todo-filter',
  standalone: true,
  imports: [MatButtonToggleModule, MatDividerModule, TitleCasePipe],
  template: `
    <div class="filter-container">
      <mat-button-toggle-group [value]="currentFilter" class="filter-buttons">
        @for (filter of filters; track filter) {
        <mat-button-toggle [value]="filter" (click)="filterChange.emit(filter)">
          {{ filter | titlecase }}
        </mat-button-toggle>
        }
      </mat-button-toggle-group>
    </div>
    <mat-divider></mat-divider>
  `,
  styles: `
    .filter-container { 
      margin-bottom: 1rem;
    }
    
    .filter-buttons { 
      width: 100%;
      margin-bottom: 1rem;
    }
    
    mat-button-toggle-group {
      display: flex;
    }
    
    mat-button-toggle {
      flex: 1;
      text-align: center;
    }
  `,
})
export class TodoFilterComponent {
  @Input() currentFilter: 'all' | 'active' | 'completed' = 'all';
  @Output() filterChange = new EventEmitter<'all' | 'active' | 'completed'>();
  filters: ('all' | 'active' | 'completed')[] = ['all', 'active', 'completed'];
}
