import { inject, Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, catchError, of, Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Tenant {
  id: string;
  nombre: string;
  hasModuloDental: boolean;
  hasModuloEstetica: boolean;
  hasModuloMedicina: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminTenantService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin/clinicas`;

  // Signals para estado
  tenants = signal<Tenant[]>([]);
  selectedTenant = signal<Tenant | null>(null);
  loading = signal<boolean>(false);

  // Computed: útil para la UI (ej: mostrar botones según módulos)
  hasDental = computed(() => this.selectedTenant()?.hasModuloDental ?? false);

  loadTenants(): Observable<Tenant[]> {
    this.loading.set(true);
    return this.http.get<Tenant[]>(this.apiUrl).pipe(
      tap(data => {
        this.tenants.set(data);
        this.loading.set(false);
      }),
      catchError(err => {
        this.loading.set(false);
        return of([]);
      })
    );
  }

  loadMyTenant(): Observable<Tenant[]> {
    console.log("Intentando cargar tenant para el usuario...");
    return this.http.get<Tenant>(`${this.apiUrl}/mi-clinica`).pipe(
      map(tenant => [tenant]), // Convertimos el objeto a un array [tenant]
      tap(tenants => this.selectedTenant.set(tenants[0])),
      catchError(() => of([])) // Retornamos un array vacío en caso de error
    );
  }

  updateModule(tenantId: string, moduleKey: string, status: boolean) {
    const field = this.getFieldByModule(moduleKey);

    return this.http.patch(`${this.apiUrl}/${tenantId}/modules`, {
      module: moduleKey,
      active: status
    }).pipe(
      tap(() => {
        // Actualización optimista de signals
        this.tenants.update(list =>
          list.map(t => t.id === tenantId ? { ...t, [field]: status } : t)
        );

        if (this.selectedTenant()?.id === tenantId) {
          this.selectedTenant.update(t => t ? { ...t, [field]: status } : null);
        }
      })
    );
  }

  private getFieldByModule(key: string): keyof Tenant {
    const map: Record<string, keyof Tenant> = {
      'DENTAL_CORE': 'hasModuloDental',
      'ESTETICA_CORE': 'hasModuloEstetica',
      'MEDICA_CORE': 'hasModuloMedicina'
    };
    return map[key];
  }
}