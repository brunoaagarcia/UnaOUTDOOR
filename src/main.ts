import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Bootstrapping a aplicação usando o appConfig garante que providers globais
// (como SUPABASE_CLIENT) já estejam disponíveis para injeção.
bootstrapApplication(App, appConfig)
  .catch((err) => console.error('Bootstrap error:', err));
