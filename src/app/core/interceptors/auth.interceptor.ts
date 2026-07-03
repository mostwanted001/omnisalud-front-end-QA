import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
// Importa tu servicio
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = localStorage.getItem('token');

  // 1. Clonar petición
  const authReq = token ? req.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  }) : req;

  // 2. Manejo de errores
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 || error.status === 403) {
        // Delegamos al AuthService la lógica de cierre de sesión
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};