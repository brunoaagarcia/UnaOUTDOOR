import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { SUPABASE_CLIENT, supabase } from '../lib/supabase/client';

// Importações para registrar a localidade pt-BR
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';

// Registra os dados de localidade para o português do Brasil
registerLocaleData(localePt);

/**
 * Configuração global da aplicação. Aqui registramos providers que devem estar
 * disponíveis antes do bootstrap, incluindo o cliente Supabase para injeção.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    // Provider global do cliente Supabase (ANON key) para injeção via SUPABASE_CLIENT
    { provide: SUPABASE_CLIENT, useValue: supabase },

    // Define o LOCALE_ID padrão da aplicação como 'pt-BR'
    { provide: LOCALE_ID, useValue: 'pt-BR' }
  ],
};
