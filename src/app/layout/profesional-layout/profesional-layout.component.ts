import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';

@Component({
  selector: 'app-profesional-layout',
  templateUrl: './profesional-layout.component.html',
  styleUrls: ['./profesional-layout.component.css'],
  imports: [CommonModule, RouterModule, RouterOutlet],
  standalone: true
})
export class ProfesionalLayoutComponent  {

  authService = inject(AuthService);
  router = inject(Router);
  isPatientContext = computed(() => this.urlSignal()?.includes('/pacientes/'));

  private urlSignal = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => (e as NavigationEnd).urlAfterRedirects),
      startWith(this.router.url) // Empezamos con la URL actual
    )
  );

  onLogout() {
    this.authService.logout();
  }

  get user() {
    return this.authService.currentUser();
  }

  get initials(): string {
    const name = this.user?.fullName;
    if (!name) return '??';

    return name
      .split(' ')
      .filter((part: string) => part.length > 0) // Tipamos 'part' como string
      .map((n: string) => n[0])                // Tipamos 'n' como string
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
}
