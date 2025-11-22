import { Injectable, signal, effect, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  isDark = signal<boolean>(false);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      const storedTheme = localStorage.getItem('theme');
      // O tema escuro é o padrão para as páginas de login
      this.isDark.set(storedTheme ? storedTheme === 'dark' : true);
    }

    // Efeito para aplicar a classe ao body sempre que o sinal mudar
    effect(() => {
      if (isPlatformBrowser(this.platformId)) {
        if (this.isDark()) {
          document.body.classList.add('theme-dark');
          localStorage.setItem('theme', 'dark');
        } else {
          document.body.classList.remove('theme-dark');
          localStorage.setItem('theme', 'light');
        }
      }
    });
  }

  toggleTheme() {
    this.isDark.update(value => !value);
  }
}