type Rol = 'Administrador' | 'Supervisor' | 'Empleado';

export interface Ubicacion{
    latitud?: number | null | undefined;
    longitud?: number | null | undefined;
    timestamp?: Date;
}

export interface Asistencia {
    fecha: Date;
    ingreso?: Ubicacion;
    salida?: Ubicacion;
    estado: 'Presente' | 'Ausente' | 'Tarde' | 'Licencia';
    horasTrabajadas?: number;
    horasExtras?: number;
}

export interface Licencia {
    tipo: 'Enfermedad' | 'Vacaciones' | 'Familiar' | 'Otro';
    fechaInicio: Date;
    fechaFin: Date;
    certificado?: string; // URL o base64 de un PDF o imagen
    estado: 'Pendiente' | 'Aprobada' | 'Rechazada';
}

export interface PedidoInsumo {
    idPedido: string;
    fecha: Date;
    items: {
        idInsumo: string;
        nombre: string;
        cantidad: number;
    }[];
    estado: 'Pendiente' | 'Aprobado' | 'Rechazado';
    observaciones?: string;
}

export interface ReciboSueldo {
    idRecibo: string;
    fecha: Date;
    horasTrabajadas: number;
    horasExtras: number;
    montoTotal: number;
    urlRecibo: string; // PDF almacenado
    firmado: boolean;
}

export interface Notificacion {
    id: string;
    fecha: Date;
    mensaje: string;
    leida: boolean;
    tipo: 'Asistencia' | 'Licencia' | 'Insumos' | 'General';
}

export interface Empleado {
    id: string;
    userId?: string;
    nombre: string;
    apellido: string;
    dni: string;
    cuil: string;
    email: string;
    telefono: string;
    rol: Rol;
    servicio: string;
    fecha: Date;
    hora: string;
    estado: 'Activo' | 'Suspendido' | 'Baja';
    ubicacionActual?: Ubicacion;
    adjuntos: string[]
    // historialAsistencia: Asistencia[];
    // licencias: Licencia[];
    // pedidosInsumos: PedidoInsumo[];
    // recibos: ReciboSueldo[];
    // notificaciones: Notificacion[];
}