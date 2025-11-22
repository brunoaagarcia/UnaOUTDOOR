import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, OnDestroy, ElementRef, Renderer2, PLATFORM_ID, ViewChild, AfterViewInit, HostListener } from '@angular/core';

import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LoginMenuComponent } from '../shared/login-menu/login-menu.component';
import { supabase } from '../../lib/supabase/client';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, LoginMenuComponent]
})
export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('parceirosCarousel') parceirosCarousel!: ElementRef;
  private scrollObserver!: IntersectionObserver;
  private carouselInterval: any;
  isMenuOpen = false;

  // Listeners para remover no OnDestroy
  private carouselListeners: (() => void)[] = [];

  // Variáveis para o arraste do carrossel
  isDragging = false;
  startX = 0;
  scrollLeft = 0;

  destaques = [
    {
      titulo: 'Outdoors Tradicionais',
      descricao: 'Soluções em comunicação visual tradicionais para sua empresa',
      imagem: 'assets/images/una ex 2.jpg'
    },
    
    {
      titulo: 'Outdoors Personalizados',
      descricao: 'Soluções em comunicação visual personalzados para sua marca',
      imagem: 'assets/images/outdoor ex1.jpg'
    },
    {
      titulo: 'Banners',
      descricao: 'Impacto visual 24 horas por dia',
      imagem: 'assets/images/una ex 3.jpg'
    },
    {
      titulo: 'Painéis',
      descricao: 'Alta tecnologia em mídia para eventos',
      imagem: 'assets/images/una brahma.jpg'
    }
  ];

  parceiros = [
    {
      nome: 'Óticas Carol',
      logo: 'assets/images/oticas carol logo.webp'
    },
    {
      nome: 'Minerva',
      logo: 'assets/images/minerva logo.webp'
    },
    {
      nome: 'Colégio Liceu',
      logo: 'assets/images/Logo-marca-Colegio-Liceu-Barretos.webp'
    },
    {
      nome: 'Rio Das Pedras',
      logo: 'assets/images/LOGO-ACQUA-PARK-logo.png'
    },
    {
      nome: 'Sr. Colchão',
      logo: 'assets/images/logo_161374716328422.png'
    },
    {
      nome: 'Desktop',
      logo: 'assets/images/Desktop logo.webp'
    },
    {
      nome: 'Cia Sports',
      logo: 'assets/images/cia sport logo.avif'
    }
  ];

  isDark = false;
  showBackToTop = false;
  showLoginMenu = false;
  private unlistenClick: (() => void) | null = null;
  private supabase = supabase;

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private el: ElementRef, private renderer: Renderer2) {}

  async ngOnInit(): Promise<void> {
    // Lógica para o tema escuro...
  }

  async ngAfterViewInit(): Promise<void> {
    if (isPlatformBrowser(this.platformId)) {
      // Load theme preference from Supabase user metadata
      try {
        const { data: { user } } = await this.supabase.auth.getUser();
        if (user && user.user_metadata && user.user_metadata['theme']) {
          this.isDark = user.user_metadata['theme'] === 'dark';
        } else {
          // Fallback to a default theme if not set
          this.isDark = false;
        }
        this.applyTheme();
      } catch (error) {
        console.error('Error fetching user theme:', error);
        // Apply a default theme in case of error
        this.isDark = false;
        this.applyTheme();
      }

      // Attach click listener to document to close login menu when clicking outside (if it's open)
      this.unlistenClick = this.renderer.listen('document', 'click', (event: Event) => {
        if (!this.el.nativeElement.contains(event.target)) {
          this.showLoginMenu = false;
        }
      });

      this.setupScrollAnimations();
      this.setupParceirosCarousel();
      this.startCarouselAutoScroll();
      this.addDragListeners();
    }
  }

  private setupParceirosCarousel(): void {
    if (isPlatformBrowser(this.platformId) && this.parceirosCarousel) {
      const carousel = this.parceirosCarousel.nativeElement;
      const innerCarousel = carousel.querySelector('.parceiros-carousel-inner');

      if (!carousel || !innerCarousel) return;

      this.carouselListeners.push(
        this.renderer.listen(carousel, 'mouseenter', () => this.stopCarouselAutoScroll())
      );
      this.carouselListeners.push(
        this.renderer.listen(carousel, 'mouseleave', () => {
          if (!this.isDragging) {
            this.startCarouselAutoScroll();
          }
        })
      );
    }
  }

  private addDragListeners(): void {
    if (!isPlatformBrowser(this.platformId) || !this.parceirosCarousel) return;

    const carousel = this.parceirosCarousel.nativeElement;
    const innerCarousel = carousel.querySelector('.parceiros-carousel-inner');
    if (!carousel || !innerCarousel) return;

    const startDragging = (pageX: number) => {
      this.isDragging = true;
      this.renderer.addClass(carousel, 'active');
      this.startX = pageX - carousel.offsetLeft;
      this.scrollLeft = innerCarousel.scrollLeft;
      this.stopCarouselAutoScroll();
    };

    const stopDragging = () => {
      if (!this.isDragging) return;
      this.isDragging = false;
      this.renderer.removeClass(carousel, 'active');
      this.startCarouselAutoScroll();
    };

    const onDrag = (pageX: number) => {
      if (!this.isDragging) return false;
      const x = pageX - carousel.offsetLeft;
      const walk = (x - this.startX) * 2; // Multiplicador para acelerar o arraste
      innerCarousel.scrollLeft = this.scrollLeft - walk;
      return true; // Indica que o evento foi tratado
    };

    this.carouselListeners.push(this.renderer.listen(carousel, 'mousedown', (e: MouseEvent) => {
      e.preventDefault();
      startDragging(e.pageX);
    }));
    
    this.carouselListeners.push(this.renderer.listen(carousel, 'touchstart', (e: TouchEvent) => {
      if (e.touches.length === 1) {
        startDragging(e.touches[0].pageX);
      }
    }));
    
    this.carouselListeners.push(this.renderer.listen(carousel, 'mouseup', stopDragging));
    this.carouselListeners.push(this.renderer.listen(carousel, 'mouseleave', stopDragging));
    this.carouselListeners.push(this.renderer.listen(carousel, 'touchend', stopDragging));
    this.carouselListeners.push(this.renderer.listen(carousel, 'touchcancel', stopDragging));
    
    this.carouselListeners.push(this.renderer.listen(carousel, 'mousemove', (e: MouseEvent) => {
      if (onDrag(e.pageX)) {
        e.preventDefault();
      }
    }));
    
    this.carouselListeners.push(this.renderer.listen(carousel, 'touchmove', (e: TouchEvent) => {
      if (e.touches.length === 1) {
        if (onDrag(e.touches[0].pageX)) {
          e.preventDefault(); // Previne o scroll da página enquanto arrasta o carrossel
        }
      }
    }));
  }

  private removeDragListeners(): void {
    this.carouselListeners.forEach(unlisten => unlisten());
    this.carouselListeners = [];
  }

  private startCarouselAutoScroll(): void {
    this.stopCarouselAutoScroll(); // Clear any existing interval first

    if (isPlatformBrowser(this.platformId) && this.parceirosCarousel) {
      const inner = this.parceirosCarousel.nativeElement.querySelector('.parceiros-carousel-inner') as HTMLElement;
      if (!inner) return;

      this.carouselInterval = setInterval(() => {
        inner.scrollLeft += 1; // Scroll by 1 pixel
        // If we reached the end of the first set of duplicated items, reset scroll position
        // This creates a seamless loop
        if (inner.scrollLeft >= inner.scrollWidth / 2) inner.scrollLeft = 0;
      }, 20); // Adjust speed (lower value = faster scroll)
    }
  }
  
  private applyTheme(): void {
    if (isPlatformBrowser(this.platformId)) {
      document.body.classList.toggle('theme-dark', this.isDark);
      document.body.classList.toggle('theme-light', !this.isDark);
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (isPlatformBrowser(this.platformId)) {
      this.showBackToTop = window.scrollY > 300;
    }
  }

  scrollToTop() {
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  private setupScrollAnimations() {
    const options = { threshold: 0.1 };
    this.scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, options);

    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach(el => this.scrollObserver.observe(el));
  }

  private stopCarouselAutoScroll(): void {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
      this.carouselInterval = null; // Set to null after clearing
    }
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  async toggleTheme(): Promise<void> {
    this.isDark = !this.isDark;
    this.applyTheme();

    // Save theme preference to Supabase
    try {
      const newTheme = this.isDark ? 'dark' : 'light';
      const { error } = await this.supabase.auth.updateUser({
        data: { theme: newTheme }
      });
      if (error) {
        console.error('Error updating theme:', error);
      }
    } catch (error) {
      console.error('Error updating theme:', error);
    }
  }

  toggleLoginMenu(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.showLoginMenu = !this.showLoginMenu;
  }

  ngOnDestroy(): void {
    if (this.unlistenClick) {
      this.unlistenClick();
      this.unlistenClick = null;
    }
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
    }
    if (this.scrollObserver) {
      this.scrollObserver.disconnect();
    }
    this.removeDragListeners();
  }
}
