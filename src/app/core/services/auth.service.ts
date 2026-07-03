import { HttpClient } from '@angular/common/http';
import { computed, inject, Service, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserProfile {
  id: string;
  fullName: string;
  clinicaId: string;
  profesional?: { id: string };
  role: 'DOCTOR' | 'DENTISTA' | 'ESTETICISTA' | 'ADMIN' | 'SUPER_ADMIN';
}

@Service()
export class AuthService {

  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = `${environment.apiUrl}/auth`;

  // Signal centralizada
  public currentUser = signal<UserProfile | null>(this.loadFromStorage());

  // Computed para acceder rápido desde cualquier componente
  public role = computed(() => this.currentUser()?.role);
  public isLogged = computed(() => !!this.currentUser());

  private loadFromStorage(): UserProfile | null {
    const data = localStorage.getItem('user_data');
    return data ? JSON.parse(data) : null;
  }



  login(credentials: { email: string; password: string }) {
    return this.http.post<{ access_token: string; user: UserProfile }>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => {
        localStorage.setItem('token', res.access_token);
        localStorage.setItem('user_data', JSON.stringify(res.user));
        this.currentUser.set(res.user);
        // Eliminamos el router.navigate de aquí
      })
    );
  }

  logout() {
    localStorage.clear();
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  get clinicaId(): string {
    return this.currentUser()?.clinicaId ?? '';
  }

  // Ajustado según tu schema: el profesional tiene un ID propio que viene en el user
  get profesionalId(): string | null {
    // Si en tu respuesta de login el ID del profesional viene en `res.user.profesional.id`
    // ajusta esta ruta según la estructura real de tu objeto usuario
    return this.currentUser()?.profesional?.id ?? '';
  }

  getProfesionalId(): string | null {
    const user = this.currentUser();
    return this.currentUser()?.profesional?.id ?? '';
  }

  // 🔥 NUEVOS: Helpers de Rol (Útiles para esconder botones en el UI)
  isDoctor() { return this.currentUser()?.role === 'DOCTOR'; }
  isDentista() { return this.currentUser()?.role === 'DENTISTA'; }
  isEsteticista() { return this.currentUser()?.role === 'ESTETICISTA'; }
  isAdmin() { return this.currentUser()?.role === 'ADMIN'; }

}


