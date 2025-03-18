import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import {
  AI_BACKEND_CONFIG,
  AiConfigurations,
} from '../../../ai-tooling/src/public-api';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: AI_BACKEND_CONFIG, useValue: AiConfigurations.OpenRouter },
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
  ],
};
