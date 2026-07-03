
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { AtencionesService } from '../../../../core/services/clinica-services/atenciones.service';
import { PacientesService } from '../../../../core/services/clinica-services/pacientes.service';

registerLocaleData(localeEs); //

@Component({
  selector: 'app-daily-view',
  templateUrl: './daily-view.component.html',
  styleUrls: ['./daily-view.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class DailyViewComponent implements OnInit {

  constructor() { }
  public atencionesService = inject(AtencionesService);
  private patientsService = inject(PacientesService);
  private authService = inject(AuthService);

  public pacientes = signal<any[]>([]);

  // Signal para controlar el modal
  showAtencionModal = signal(false);
  selectedPacienteId = signal<string | null>(null);


// Variables para el registro express de paciente nuevo
nombreNuevo: string = '';
rutNuevo: string = '';




  // Signal de la fecha actual (Iniciamos en la fecha de tu captura)
  public selectedDate = signal<Date>(new Date());
  public searchTerm = signal<string>('');

  public atencionesFiltradas = computed(() => {
    const atenciones = this.atencionesService.atenciones();
    const d = this.selectedDate();
    const busqueda = this.searchTerm().toLowerCase();

    // 1. Obtenemos el string "YYYY-MM-DD" de la fecha seleccionada en el calendario
    // Usamos 'sv-SE' porque es el estándar internacional (ISO) que devuelve YYYY-MM-DD
    const fechaSeleccionadaStr = d.toLocaleDateString('sv-SE');

    console.log('--- Filtrando Agenda ---');
    console.log('Fecha Seleccionada (Local):', fechaSeleccionadaStr);

    return atenciones.filter(cita => {
      if (!cita.fecha) return false;

      // 2. Extraemos los primeros 10 caracteres del ISO de la base de datos
      // "2026-05-18T00:00:00.000Z" -> "2026-05-18"
      const fechaCitaStr = cita.fecha.split('T')[0];

      // 3. Comparamos strings puros. Esto es inmune al desfase horario.
      const coincideFecha = fechaCitaStr === fechaSeleccionadaStr;

      const fullName = cita.paciente?.user?.fullName?.toLowerCase() || '';
      const rut = cita.paciente?.user?.rut || ''; // Ajusta según donde guardes el RUT

      const coincideBusqueda =
        fullName.includes(busqueda) ||
        rut.includes(busqueda);

      if (coincideFecha) {
        console.log('✅ Match día correcto para:', cita.paciente?.user?.fullName);
      }

      return coincideFecha && coincideBusqueda;
    });
  });

  nuevaCita = {
    pacienteId: '',
    dentistaId: '', // 👈 Añadimos el campo aquí
    fecha: '',
    hora: '',
    duracion: '15',
    motivo: '',
    sede: 'CHILLAN',
    esNuevo: false,
    nombreNuevo: '',
    rutNuevo: ''
  };

  // ... dentro de la clase
step = signal(1);
esNuevo = signal(false);

// Generamos bloques de 09:00 a 19:00 cada 30 min
bloquesHorarios = signal([
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'
]);

// 1. Añade este método para los colores de Tailwind
getEstadoEstilos(estado: string): string {
  const map: { [key: string]: string } = {
    'Atendido':              'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
    'Atendiéndose':          'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
    'Confirmado por teléfono': 'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100',
    'En sala de espera':     'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
    'No asiste':             'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
    'No confirmado':         'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200',
    'Anulado':               'bg-gray-200 text-gray-700 border-gray-400 hover:bg-gray-300'
  };
  return map[estado] || 'bg-white text-slate-700 border-slate-200';
}




  ngOnInit() {
   this.cargarCitas();
   this.loadPacientes();
  }

  // 2. Añade este método para conectar con el servicio que actualiza la BD
  cambiarEstadoCita(cita: any, nuevoEstado: string) {
    const estadoAnterior = cita.status;
    cita.status = nuevoEstado; // Actualiza 'status' en vez de 'estado'

    this.atencionesService.update(cita.id, { status: nuevoEstado }).subscribe({
      error: (err) => {
        console.error(err);
        cita.status = estadoAnterior; // Revertir si falla
      }
    });
  }

  loadPacientes() {
    // Asegúrate de que findAll() devuelva un Observable (como HttpClient.get)
    this.patientsService.findAll().subscribe({
      next: (data: any[]) => {
        this.pacientes.set(data);
        console.log('Pacientes cargados:', data);
      },
      error: (err) => {
        console.error('Error al cargar pacientes:', err);
      }
    });
  }

  // Helpers para los estilos dinámicos de tu captura
  getSituacionClass(situacion: string) {
    const styles: any = {
      'Diagnóstico': 'bg-emerald-600 text-white',
      'Deudas': 'bg-rose-600 text-white',
      'No hay saldo': 'bg-amber-500 text-white'
    };
    return styles[situacion] || 'bg-slate-200 text-slate-600';
  }

  getSituacionIcon(situacion: string) {
    const icons: any = {
      'Diagnóstico': 'fa-user-doctor',
      'Deudas': 'fa-triangle-exclamation',
      'No hay saldo': 'fa-dollar-sign'
    };
    return icons[situacion] || 'fa-circle';
  }


  changeDate(days: number) {
    const current = this.selectedDate();
    const next = new Date(current);

    // 1. Movemos el día
    next.setDate(current.getDate() + days);

    // 2. IMPORTANTE: Forzamos la medianoche local
    // Esto evita que el desfase de Chile (UTC-4) nos mueva de día
    next.setHours(0, 0, 0, 0);

    this.selectedDate.set(next);

    // 3. Cargamos los datos (asegúrate de que cargarCitas use este nuevo Signal)
    this.cargarCitas();
}



  private cargarCitas() {
    // Formato YYYY-MM-DD
    const fechaISO = this.selectedDate().toISOString().split('T')[0];

    // Limpiamos el buscador al cambiar de fecha para evitar filtros cruzados
    this.searchTerm.set('');

    this.atencionesService.findAll(fechaISO).subscribe({
      next: (res) => {
        console.log(`✅ Datos recibidos para ${fechaISO}:`, res.length);
      }
    });
  }

  // Método para abrir el modal desde la agenda o lista
  openAtencion() {
    // 1. Obtenemos el valor actual del signal
    const user = this.authService.currentUser();

    // Usamos 'profileId' que es como viene en tu localStorage
    const idDelDentista = user?.profesional?.id ?? '';

  console.log('DEBUG: Datos del usuario en el signal:', user);
  console.log('DEBUG: ID del dentista detectado:', idDelDentista);

  this.nuevaCita = {
    pacienteId: '',
    dentistaId: idDelDentista || '', // 👈 Capturamos el ID del dentista
    fecha: this.selectedDate().toISOString().split('T')[0],
    hora: '',
    duracion: '15',
    motivo: '',
    sede: 'CHILLAN',
    esNuevo: false,
    nombreNuevo: '',
    rutNuevo: ''
  };
  this.showAtencionModal.set(true);
}

  closeModal() {
    this.showAtencionModal.set(false);
  }

  savedAtencion() {
    // 1. Validaciones de seguridad antes de disparar a NestJS
  if (!this.nuevaCita.fecha || !this.nuevaCita.hora) {
    console.error('Falta fecha u hora');
    return;
  }

  // 2. Preparamos el payload
  const payload = {
    ...this.nuevaCita,
    esNuevo: this.esNuevo(), // Le avisamos al backend si debe crear un User nuevo
    sede: 'CHILLAN',
    nombreNuevo: this.nombreNuevo,
    rutNuevo: this.rutNuevo
  };

  console.log('Enviando agendamiento a NestJS:', payload);

  // 3. Llamada al servicio de atenciones/citas
  this.atencionesService.create(payload).subscribe({
    next: (res) => {
      console.log('✅ Cita agendada con éxito en la base de datos');

      // Refrescamos la lista de la vista diaria para que aparezca la nueva cita
      // Llamamos a tu método para refrescar la lista de la Sede Chillán
      this.cargarCitas();
      this.atencionesService.showSuccess('¡Atencion registrada con éxito!');



      // Cerramos y reseteamos
      this.closeModal();

      // Opcional: Una notificación de éxito (Toast)
      // this.toast.success('Cita confirmada');
    },
    error: (err) => {
      console.error('❌ Error al agendar:', err);
      // Aquí podrías manejar si la hora se ocupó justo antes
    }
  });

    this.closeModal();
  }

  selectHora(hora: string) {
    this.nuevaCita.hora = hora;
    this.step.set(2); // Saltamos a elegir paciente
  }

  backToStep1() {
    this.step.set(1);
  }

  onFechaChange() {
    console.log('Cambiando agenda para el día:', this.nuevaCita.fecha);
    // Aquí podrías llamar a un método para verificar qué horas ya están ocupadas
    // y deshabilitar los botones de la grilla que correspondan.
    this.nuevaCita.hora = ''; // Reseteamos la hora al cambiar el día para evitar errores
  }

  getHoraFin(horaInicio: string, duracionMin: string | number): string {
    if (!horaInicio) return '--:--';

    const [horas, minutos] = horaInicio.split(':').map(Number);
    const date = new Date();
    date.setHours(horas, minutos + Number(duracionMin));

    return date.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

}
