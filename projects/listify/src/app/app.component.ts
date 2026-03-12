import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  inject,
  signal,
  viewChildren,
} from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, skip } from 'rxjs';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { LayoutService } from './core/layout/layout.service';
import { SidebarComponent } from './shell/sidebar/sidebar.component';
import { BottomNavComponent } from './shell/bottom-nav/bottom-nav.component';
import { ToolbarComponent } from './shell/toolbar/toolbar.component';
import { ChatComponent } from './features/chat/chat.component';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    MatSidenavModule,
    MatIconButton,
    MatIcon,
    SidebarComponent,
    BottomNavComponent,
    ToolbarComponent,
    ChatComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class App {
  protected readonly layoutService = inject(LayoutService);
  private readonly router = inject(Router);
  private readonly titleService = inject(Title);

  /** Query all #mainContent refs (mobile or desktop — only one is active at a time) */
  private readonly mainContentRefs = viewChildren<ElementRef<HTMLElement>>('mainContent');

  protected readonly sidebarOpen = signal(true);
  protected readonly chatSidebarOpen = signal(true);

  protected readonly pageTitle = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => this.titleService.getTitle() || 'Listify'),
    ),
    { initialValue: 'Listify' },
  );

  /** Focus management: move focus to main content after route navigation */
  private readonly focusOnNavigation = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      skip(1), // Skip initial navigation — don't steal focus on first load
      map(() => {
        requestAnimationFrame(() => {
          const refs = this.mainContentRefs();
          if (refs.length > 0) {
            refs[0].nativeElement.focus();
          }
        });
        return true;
      }),
    ),
  );

  protected toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  protected toggleChatSidebar(): void {
    this.chatSidebarOpen.update((open) => !open);
  }
}
