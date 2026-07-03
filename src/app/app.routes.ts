import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [

  // Ruta de Login: Carga perezosa del componente
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component.js').then(m => m.LoginComponent)
  },

  // Panel Administrativo: Protegido por Guard
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/admin-layout/admin-layout.component.js').then(m => m.AdminLayoutComponent)
  },

  // Panel del Dentista: Protegido por Guard
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/profesional-layout/profesional-layout.component.js').then(m => m.ProfesionalLayoutComponent),
    children: [
      {
        path: 'agenda',
        loadComponent: () => import('./features/agenda/agenda.component.js').then(m => m.AgendaComponent),
        children: [
          { path: '', redirectTo: 'diaria', pathMatch: 'full' }, // Por defecto a diaria
          { path: 'diaria', loadComponent: () => import('./features/agenda/components/daily-view/daily-view.component.js').then(m => m.DailyViewComponent) },
          { path: 'semanal', loadComponent: () => import('./features/agenda/components/weekly-view/weekly-view.component.js').then(m => m.WeeklyViewComponent) }
        ]
      },
      // Puedes añadir más aquí: agenda, pacientes, odontograma, etc.
    ]
  },

  // Redirección por defecto
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];


