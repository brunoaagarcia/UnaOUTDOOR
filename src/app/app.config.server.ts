import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { SUPABASE_CLIENT, supabase } from '../lib/supabase/client';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    { provide: SUPABASE_CLIENT, useValue: supabase },
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
