import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

interface NavItem {
  readonly path: string;
  readonly label: string;
  readonly icon: string;
}

@Component({
  selector: 'app-bottom-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  template: `
    <nav aria-label="Main navigation">
      @for (item of navItems; track item.path) {
        <a
          [routerLink]="item.path"
          routerLinkActive="active"
          class="nav-item"
          [attr.aria-label]="item.label"
        >
          <span class="icon-wrapper">
            <mat-icon>{{ item.icon }}</mat-icon>
          </span>
          <span class="nav-label">{{ item.label }}</span>
        </a>
      }
    </nav>
  `,
  styles: `
    :host {
      display: block;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 80px;
      background: var(--mat-sys-surface-container);
      border-top: 1px solid var(--mat-sys-outline-variant);
      z-index: 100;
    }

    nav {
      display: flex;
      height: 100%;
      align-items: center;
      justify-content: space-around;
    }

    .nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      text-decoration: none;
      color: var(--mat-sys-on-surface-variant);
      min-width: 64px;
      padding: 0 12px;
    }

    .icon-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 16px;
      padding: 4px 20px;
      transition: background 200ms ease;
    }

    .nav-item.active {
      color: var(--mat-sys-on-surface);
    }

    .nav-item.active .icon-wrapper {
      background: var(--mat-sys-secondary-container);
    }

    .nav-item.active mat-icon {
      color: var(--mat-sys-on-secondary-container);
    }

    .nav-label {
      font: var(--mat-sys-label-medium);
    }
  `,
})
export class BottomNavComponent {
  readonly navItems: readonly NavItem[] = [
    { path: '/chat', label: 'Chat', icon: 'chat' },
    { path: '/tasks', label: 'Tasks', icon: 'checklist' },
  ];
}
