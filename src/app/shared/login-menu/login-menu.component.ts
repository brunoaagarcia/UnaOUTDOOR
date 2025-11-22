import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-login-menu',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="login-wrapper">
    </div>
  `,
  styleUrls: ['./login-menu.component.css']
})
export class LoginMenuComponent {
  constructor(private router: Router) {}
}
