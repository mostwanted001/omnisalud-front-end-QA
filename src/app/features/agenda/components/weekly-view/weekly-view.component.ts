import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { AtencionesService } from '../../../../core/services/clinica-services/atenciones.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PacientesService } from '../../../../core/services/clinica-services/pacientes.service';
import { Paciente } from '../../../../core/models/agenda.model';


@Component({
  selector: 'app-weekly-view',
  templateUrl: './weekly-view.component.html',
  styleUrls: ['./weekly-view.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule]
})
export class WeeklyViewComponent implements OnInit {
  public atencionesService = inject(AtencionesService);
  public pacienteService = inject(PacientesService); // Ajusta esto a tu servicio real de pacientes
  public atenciones = computed(() => this.atencionesService.atenciones());
  // Estado para el menú contextual
public activeMenu = signal<{ day: Date, interval: string, x: number, y: number } | null>(null);
public activeCitaMenu = signal<{ cita: any, x: number, y: number } | null>(null);
public duracionCalculada = signal<number>(15);
public opcionesDuracion = signal<number[]>([]);
public tipoPaciente = signal<'existente' | 'nuevo'>('existente');
public fechaSeleccionada = signal<Date | null>(null);
public horaSeleccionada = signal<string | null>(null);
public mostrarErrorPasado = signal(false);
private getNombreDesdeStorage(): string {
  try {
    const data = localStorage.getItem('user_data');
    if (!data) return 'Profesional';
    return JSON.parse(data).fullName || 'Profesional';
  } catch (e) {
    console.error("Error al leer user_data:", e);
    return 'Profesional';
  }
}

public nombreProfesional = signal(this.getNombreDesdeStorage());
public pacientesEncontrados = signal<any[]>([]);
public pacienteSeleccionado = signal<any>(null); // Definir la señal
public nombreBuscador = signal('');
public citaAgendadaExitosa = signal(false);
public presupuestoSeleccionadoId = signal<string | null>(null);

isModalOpen = signal(false);

modalStep = signal<'duracion' | 'datos-paciente' | 'exito' | null>(null);

getProfesionalId(): string {
  const userData = localStorage.getItem('user_data');
  if (userData) {
    const data = JSON.parse(userData);
    // Basado en tu captura, el ID del profesional está en data.id
    return data.profileId;
  }
  return '';
}

continuar() {
  const pasoActual = this.modalStep();

  if (pasoActual === 'duracion') {
    // Si estás en duración, pasas a datos del paciente
    this.modalStep.set('datos-paciente');
  }
  else if (pasoActual === 'datos-paciente') {
    // Aquí ejecutas la lógica de guardar la cita
    this.agendarCita();
  }

}


async agendarCita() {
  const profesionalId = this.getProfesionalId(); // Obtenemos el ID real
  const presupuestoId = this.presupuestoSeleccionadoId(); // ID seleccionado del radio

  const fechaSeleccionada = this.fechaSeleccionada();

  // VALIDACIÓN: Si es null, detenemos la ejecución
  if (!fechaSeleccionada) {
    console.error("No se ha seleccionado una fecha");
    alert("Por favor selecciona una fecha válida en el calendario.");
    return;
  }

  // Ahora TS sabe que 'fechaSeleccionada' no es null
  const fecha = new Date(fechaSeleccionada);


  console.log("--- DEBUG AGENDAMIENTO ---");
  console.log("profesionalId:", profesionalId, "Tipo:", typeof profesionalId);
  console.log("presupuestoId:", presupuestoId, "Tipo:", typeof presupuestoId);
  console.log("pacienteId:", this.pacienteSeleccionado()?.id, "Tipo:", typeof this.pacienteSeleccionado()?.id);

  if (!presupuestoId) {
    alert("Por favor, selecciona un plan de tratamiento");
    return;
  }

  const datosCita = {
    fecha: fecha,
    procedimiento: 'Atención Dental', // Puedes hacerlo dinámico también
    pacienteId: this.pacienteSeleccionado()?.id,
    profesionalId: profesionalId, // ID obtenido del localStorage
    presupuestoId: presupuestoId,
    observaciones: 'Cita agendada desde OmniSalud'
  };

  try {
    await this.atencionesService.create(datosCita).toPromise();
    this.modalStep.set('exito');
    this.cargarAtencionesSemana();
  } catch (error) {
    console.error("Error al agendar:", error);
  }
}

seleccionarPaciente(paciente: any) {
  if (!paciente) {
    console.error("El objeto paciente recibido es undefined");
    return;
  }

  // Asignamos el objeto recibido a la señal
  this.pacienteSeleccionado.set(paciente);

  this.nombreBuscador.set(paciente.user.fullName);

  // Limpiamos el filtro
  this.pacienteService.filterQuery.set('');

  console.log("Paciente guardado correctamente:", this.pacienteSeleccionado());
}

onInputChange(event: Event) {
  const query = (event.target as HTMLInputElement).value;

  this.nombreBuscador.set(query);

  // 1. Actualizamos el filtro en el servicio
  this.pacienteService.filterQuery.set(query);

  // 2. No necesitas setear pacientesEncontrados manualmente,
  // porque tu variable 'resultados' (que viene del computed) ya se actualiza sola.

  if (query === '') {
    this.pacienteSeleccionado.set(null);
  }
}

setTipoPaciente(tipo: 'existente' | 'nuevo') {
  this.tipoPaciente.set(tipo);
}

openModal() {
  const menuData = this.activeMenu(); // Recuperamos lo que guardamos al abrir el menú

  if (menuData) {
    // Llamamos a la lógica correcta pasando el día y la hora guardados
    this.abrirModal(menuData.day, menuData.interval);
  } else {
    // Caso de emergencia o fallback
    this.modalStep.set('duracion');
  }
}
goToPatientForm() {
  // Aquí saltamos al segundo paso
  this.modalStep.set('datos-paciente');
}

closeAll() { this.modalStep.set(null); }

public seleccionando = signal(false);
public inicioSeleccion = signal<{dia: Date, hora: string} | null>(null);

iniciarSeleccion(dia: Date, hora: string) {
  this.seleccionando.set(true);
  this.inicioSeleccion.set({dia, hora});
}

// Cuando el usuario suelta el mouse
finalizarSeleccion(diaFin: Date, horaFin: string) {
  if (!this.seleccionando()) return;

  const totalMinutos = this.calcularMinutos(this.inicioSeleccion()!, {diaFin, horaFin});

  // REDONDEO CRÍTICO: Aseguramos que siempre sea múltiplo de 15
  const duracionRedondeada = Math.ceil(totalMinutos / 15) * 15;

  this.duracionCalculada.set(duracionRedondeada);
  this.seleccionando.set(false);

  // Saltamos directo al formulario porque ya tenemos la duración
  this.modalStep.set('datos-paciente');
}

private formatMinutos(totalMinutos: number): string {
  const horas = Math.floor(totalMinutos / 60);
  const minutos = totalMinutos % 60;

  // Formatea a "HH:MM" (ej: 08:30)
  return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
}

getBloquesDisponibles(dia: Date, horaInicio: string): number {
  const atenciones = this.getAtencionesPorDia(dia);
  const [h, m] = horaInicio.split(':').map(Number);
  const inicioMinutos = (h * 60) + m;

  let bloquesLibres = 0;
  let tiempoActual = inicioMinutos;

  // Escaneamos bloque a bloque (15 min) hasta las 22:00 (1320 minutos)
  while (tiempoActual < 1320) {
    const horaStr = this.formatMinutos(tiempoActual);

    // Comparación: ¿existe alguna cita con esta hora?
    const ocupado = atenciones.some(a => {
        // Asegúrate de que tu objeto 'a' (atención) tenga un campo 'hora' en formato "HH:MM"
        return a.hora === horaStr;
    });

    if (ocupado) break;

    bloquesLibres++;
    tiempoActual += 15;
  }

  return bloquesLibres;
}

abrirModal(dia: Date, horaInicio: string) {

  const hoy = new Date();
  // Limpiamos las horas para comparar solo las fechas
  hoy.setHours(0, 0, 0, 0);
  const diaSeleccionado = new Date(dia);
  diaSeleccionado.setHours(0, 0, 0, 0);

  this.fechaSeleccionada.set(dia);
  this.horaSeleccionada.set(horaInicio);

  this.pacienteService.filterQuery.set('');

  // 1. Calculamos el máximo real de bloques libres desde ese punto
  const maxBloques = this.getBloquesDisponibles(dia, horaInicio);
  console.log(maxBloques)

  if (maxBloques === 0) {
    alert("Este horario ya está ocupado");
    return; // No abrimos el modal si no hay espacio
  }

  if (diaSeleccionado < hoy) {
    this.mostrarErrorPasado.set(true);
    return;
  }



  // 2. Llenamos el select solo hasta el máximo disponible
  // Usamos maxBloques (que es el valor correcto) en lugar de la variable que no existía
  this.opcionesDuracion.set(
    Array.from({ length: maxBloques }, (_, i) => (i + 1) * 15)
  );

  // 3. Abrimos el modal
  this.duracionCalculada.set(15); // Default inicial
  this.modalStep.set('duracion');
  this.isModalOpen.set(true); // <--- Esto te faltaba para abrir el modal
}

private calcularMinutos(
  inicio: { dia: Date, hora: string },
  fin: { diaFin: Date, horaFin: string }
): number {
  // Convertimos las horas (ej: "09:15") a minutos totales desde la medianoche
  const [h1, m1] = inicio.hora.split(':').map(Number);
  const [h2, m2] = fin.horaFin.split(':').map(Number);

  const minutosInicio = (h1 * 60) + m1;
  const minutosFin = (h2 * 60) + m2;

  // Calculamos la diferencia
  let diff = minutosFin - minutosInicio;

  // Si el arrastre es hacia atrás o el usuario se confundió, devolvemos mínimo 15 min
  return diff > 0 ? diff : 15;
}



// 1. Define la altura de un bloque de 15 minutos en píxeles
readonly DURACION_HEIGHTS: { [key: number]: number } = {
  15: 39,
  30: 58,
  45: 78,
  60: 100,
  90: 137
};
readonly HORA_INICIO = 8; // Tu agenda empieza a las 08:00 AM

readonly BLOQUE_MINUTOS = 15;
readonly ALTURA_BASE = 39; // px


getAlturaDinamica(duracion: string | number): string {
  // 1. Asegurar que tenemos un número válido
  const min = parseInt(String(duracion), 10);

  if (isNaN(min) || min <= 0) {
    console.warn("Duración inválida, usando 15 min por defecto:", duracion);
    return `${this.ALTURA_BASE}px`;
  }

  // 2. Calcular bloques basado en tu unidad base (39px por cada 15min)
  // Ej: 90 / 15 = 6 bloques. 6 * 39 = 234px
  const bloques = min / this.BLOQUE_MINUTOS;
  const alturaCalculada = bloques * this.ALTURA_BASE;

  console.log(`DEBUG: Duración ${min}min = ${bloques} bloques = ${alturaCalculada}px`);

  return `${alturaCalculada}px`;
}

getPosicionTop(horaStr: string): string {
  if (!horaStr) return '0px';
  const [horas, minutos] = horaStr.split(':').map(Number);

  const minutosDesdeInicio = (horas - this.HORA_INICIO) * 60 + minutos;
  const bloquesDe15 = minutosDesdeInicio / this.BLOQUE_MINUTOS;

  // Ahora el top coincide perfectamente con la rejilla de bloques
  return `${bloquesDe15 * this.ALTURA_BASE}px`;
}


  public today = new Date();

  // Horas de 08:00 a 22:00
  public hours = Array.from({ length: 15 }, (_, i) => i + 8);

  public intervals = Array.from({ length: (22 - 8) * 4 + 1 }, (_, i) => {
    const totalMinutes = i * 15;
    const hour = Math.floor(totalMinutes / 60) + 8;
    const minutes = totalMinutes % 60;
    return {
      label: `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
      hour,
      minutes
    };
  });

  // Signal para el lunes de la semana actual
  public startOfWeek = signal<Date>(this.getMonday(new Date()));

  // Genera los 7 días de la semana (Lunes a Domingo)
  public weekDays = computed(() => {
    const days = [];
    const start = new Date(this.startOfWeek());
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  });

  constructor() { }

  ngOnInit() {
    this.atencionesService.findAll().subscribe();
    this.pacienteService.findAll().subscribe({
      next: (data) => {
        console.log('Pacientes cargados en el servicio:', data);
        console.log('Longitud de la lista:', this.pacienteService.pacientes().length);
      }
    });
  }

  private getMonday(d: Date) {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  changeWeek(weeks: number) {
    const next = new Date(this.startOfWeek());
    next.setDate(next.getDate() + (weeks * 7));
    this.startOfWeek.set(next);
    this.cargarAtencionesSemana();
  }

  isSunday(date: Date): boolean {
    return date.getDay() === 0;
  }

  getAtencionesPorDia(day: Date) {
    // Formato "YYYY-MM-DD" local de la columna de la agenda
    const fechaGrilla = day.toLocaleDateString('sv-SE');

    return this.atencionesService.atenciones().filter(cita => {
        // Extraemos solo la parte de la fecha del ISO que viene de Prisma
        // cita.fecha es "2026-05-18T00:00:00.000Z" -> split da "2026-05-18"
        const fechaCita = cita.fecha.split('T')[0];

        return fechaCita === fechaGrilla;
    });
  }

  // 4. Cálculo de posición (Celdas de h-24 = 96px)
  calcularTop(fecha: string): string {
    if (!fecha) return '0px';

    const date = new Date(fecha);

    // USAMOS UTC PARA EVITAR EL DESFASE DE CHILE (UTC-4)
    const hour = date.getUTCHours();
    const minutes = date.getUTCMinutes();

    // Offset desde las 08:00 AM
    const hourOffset = hour - 8;

    // 40px por cada 15 min = 160px por hora
    const topFromHours = hourOffset * 160;
    const topFromMinutes = (minutes / 15) * 40;

    const totalTop = topFromHours + topFromMinutes;

    // El log ahora debería decir: Cita a las 10:30 -> Top: 400px
    console.log(`Cita a las ${hour}:${minutes} (UTC) -> Top: ${totalTop}px`);

    return `${totalTop}px`;
  }
  private cargarAtencionesSemana() {
    const fechaISO = this.startOfWeek().toISOString().split('T')[0];
    // Llamada a NestJS usando el parámetro fecha
    this.atencionesService.findAll(fechaISO).subscribe();
  }

  openMenu(event: MouseEvent, day: Date, interval: string) {
    // Evitamos que el clic se propague si hay algo detrás
    event.stopPropagation();

    // Si ya está abierto en la misma celda, lo cerramos (toggle)
    if (this.activeMenu()?.interval === interval && this.activeMenu()?.day === day) {
      this.activeMenu.set(null);
      return;
    }

    // Guardamos la posición del clic y los datos de la celda
    this.activeMenu.set({
      day,
      interval,
      x: event.clientX,
      y: event.clientY
    });
  }

  // Cerrar menú al hacer clic fuera (llamar desde el scroll o el fondo)
  closeMenu() {
    this.activeMenu.set(null);
  }

  openCitaMenu(event: MouseEvent, cita: any) {
    event.preventDefault();
    event.stopPropagation();

    // Cerramos el menú de "Dar cita" si estuviera abierto
    this.activeMenu.set(null);

    this.activeCitaMenu.set({
      cita,
      x: event.clientX,
      y: event.clientY
    });
  }

  closeCitaMenu() {
    this.activeCitaMenu.set(null);
  }










}
