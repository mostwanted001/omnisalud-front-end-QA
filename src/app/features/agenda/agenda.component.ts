import { Component, inject, OnInit, signal } from '@angular/core';
import { AtencionesService } from '../../core/services/clinica-services/atenciones.service';
import { DailyViewComponent } from "./components/daily-view/daily-view.component";
import { WeeklyViewComponent } from "./components/weekly-view/weekly-view.component";
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-agenda',
  templateUrl: './agenda.component.html',
  styleUrls: ['./agenda.component.css'],
  imports: [CommonModule, RouterOutlet]
})
export class AgendaComponent implements OnInit {

  public viewMode = signal<'dia' | 'semana'>('dia');
  private router = inject(Router);
  private route = inject(ActivatedRoute);



  public atencionesService = inject(AtencionesService);
  hoy = new Date();

  constructor() { }

  ngOnInit(): void {
    // Disparamos la carga inicial

  }

  setMode(mode: 'dia' | 'semana') {
    // Navega a la ruta hija relativa (ej: 'diaria' o 'semanal')
    const path = mode === 'dia' ? 'diaria' : 'semanal';
    this.router.navigate([path], { relativeTo: this.route });
  }

  // Para que el botón sepa cuál está activo basado en la URL real
  isModeActive(mode: 'dia' | 'semana'): boolean {
    const path = mode === 'dia' ? 'diaria' : 'semanal';
    return this.router.url.includes(path);
  }

}
