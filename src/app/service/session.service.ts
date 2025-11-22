import { Injectable, Inject, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import type { SupabaseClient, Session } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../lib/supabase/client';

/**
 * Serviço global que mantém o estado reativo da sessão do usuário.
 */
@Injectable({ providedIn: 'root' })
export class SessionService implements OnDestroy {
  private readonly _sessionSubject = new BehaviorSubject<Session | null>(null);
  public readonly session$: Observable<Session | null> = this._sessionSubject.asObservable();

  // subscription retornada pelo listener de auth do Supabase
  private _subscription: { unsubscribe: () => void } | null = null;

  constructor(@Inject(SUPABASE_CLIENT) private supabase: SupabaseClient) {
    // Registra listener de mudanças de autenticação
    try {
      const { data } = this.supabase.auth.onAuthStateChange((event: string, session: Session | null) => {
        // event ex: 'SIGNED_IN', 'SIGNED_OUT', etc.
        this._sessionSubject.next(session ?? null);
      });

      // data.subscription tem o método unsubscribe em supabase-js v2
      this._subscription = (data as any)?.subscription ?? null;
    } catch (err) {
      // não bloquear a aplicação apenas por falha no listener
      // eslint-disable-next-line no-console
      console.warn('SessionService: falha ao registrar listener de auth', err);
    }
  }

  /**
   * Inicializa a sessão ao startup da aplicação.
   * Deve ser chamado uma vez (ex: em App component ou main.ts) para popular o estado inicial.
   */
  async initializeSession(): Promise<Session | null> {
    try {
      const res = await this.supabase.auth.getSession();
      const session = (res as any)?.data?.session ?? null;
      this._sessionSubject.next(session);
      return session;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('SessionService: erro ao inicializar sessão', err);
      this._sessionSubject.next(null);
      return null;
    }
  }

  /**
   * Atualiza manualmente a sessão — usado por AuthService após login/logout.
   */
  updateSession(session: Session | null) {
    this._sessionSubject.next(session);
  }

  ngOnDestroy(): void {
    try {
      if (this._subscription && typeof this._subscription.unsubscribe === 'function') {
        this._subscription.unsubscribe();
      }
    } catch (e) {
      // ignore
    }
  }
}
