export interface Atencion {
  id:            string;
  fecha:         string; // ISO String
  procedimiento: string;
  diente:        number | null;
  observaciones: string;
  fechaTermino:  string | null;
  status:        string;
  monto:         string;
  pagado:        boolean;
  pacienteId:    string;
  dentistaId:    string;
  deletedAt:     string | null;
  createdAt:     string;
  updatedAt:     string;
  presupuestoId: string;
  paciente:      Paciente;
  dentista:      Dentista;
}


export type Sexo = 'MASCULINO' | 'FEMENINO' | 'OTRO';

export interface Paciente {
  id: string;
  userId: string;

  // ✅ Datos Demográficos
  fechaNacimiento?: string | Date; // ISO String desde NestJS/Prisma
  sexo?: Sexo;
  ciudad: string;
  direccion: string;
  comuna: string;

  // ✅ Triada Médica Crítica (Fundamentales para odontología)
  alergias?: string;
  enfermedades?: string;
  medicamentos?: string;

  // ✅ Objeto User anidado (Resultado del include de Prisma)
  user: UserBase;

  // ✅ Metadatos de auditoría
  createdAt?: Date | string;
  updatedAt?: Date | string;
  // Campo calculado opcional para el Front
  status?: 'completa' | 'pendiente';
  atenciones?: any[];
  presupuestos: Presupuesto[];
  fullName: string;
  rut: string;
  email: string;
  clinicaId?: string;
}


export interface Dentista {
  id:           string;
  especialidad: string;
  boxAsignado:  number;
  userId:       string;
  user:         UserBase;
}

export interface UserBase {
  fullName: string;
  rut: string;
  email: string;
  phone?: string;
}

export interface PresupuestoItem {
  id?: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
}

export interface Presupuesto {
  id: string;
  total: number | string;
  estado: 'PENDIENTE' | 'ACEPTADO' | 'RECHAZADO' | 'FINALIZADO';
  items?: PresupuestoItem[];
  createdAt?: string | Date;

}