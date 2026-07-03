import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { AdminTenantService } from '../services/admin-tenant.service';

export const authGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const adminService = inject(AdminTenantService);

  // 1. Verificación rápida de token
  const token = localStorage.getItem('token');
  if (!token || !authService.isLogged()) {
    router.navigate(['/login']);
    return false;
  }

  // 2. Si ya cargamos el tenant, dejamos pasar
  if (adminService.selectedTenant()) return true;

  // 3. Carga diferida según rol
  try {
    const role = authService.currentUser()?.role;
    const loader$ = role === 'SUPER_ADMIN'
      ? adminService.loadTenants()
      : adminService.loadMyTenant();

    await firstValueFrom(loader$);
    return true;
  } catch (err) {
    console.error("Error cargando sesión:", err);
    router.navigate(['/login']);
    return false;
  }
};
