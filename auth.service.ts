import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseClient, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { supabase } from './src/lib/supabase/client';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private router = inject(Router);
  private supabase: SupabaseClient = supabase;

  constructor() {}

  get client() {
    return this.supabase;
  }

  async signIn(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({
      email,
      password,
    });
  }

  async getSession() {
    return this.supabase.auth.getSession();
  }

  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return this.supabase.auth.onAuthStateChange(callback);
  }

  async logout() {
    await this.supabase.auth.signOut();
    await this.router.navigate(['/login']);
  }
}