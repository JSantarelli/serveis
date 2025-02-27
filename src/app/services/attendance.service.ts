// attendance.service.ts
import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, query, where, orderBy, doc, getDoc, setDoc, addDoc, onSnapshot } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Empleado, Asistencia, Ubicacion } from '../models/employer';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  
  constructor(private firestore: Firestore) {}
  
  // Get today's attendance records for all employees
  getTodayAttendanceRecords(): Observable<any[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const registrosRef = collection(this.firestore, 'registros-asistencia');
    const q = query(
      registrosRef, 
      where('fecha', '>=', today),
      where('fecha', '<', tomorrow),
      orderBy('fecha', 'desc')
    );
    
    return collectionData(q, { idField: 'id' });
  }
  
  // Get attendance history for a specific employee
  getEmployeeAttendanceHistory(employeeId: string): Observable<Asistencia[]> {
    const docRef = doc(this.firestore, `empleados/${employeeId}`);
    
    return new Observable<Asistencia[]>(observer => {
      const unsubscribe = onSnapshot(docRef, (snapshot) => {
        const employeeData = snapshot.data() as Empleado;
        if (employeeData && employeeData.historialAsistencia) {
          observer.next(employeeData.historialAsistencia);
        } else {
          observer.next([]);
        }
      }, error => {
        observer.error(error);
      });
      
      return unsubscribe;
    });
  }
  
  // Get all employees currently checked in
  getCheckedInEmployees(): Observable<any[]> {
    const empleadosRef = collection(this.firestore, 'empleados');
    const q = query(
      empleadosRef,
      where('ubicacionActual', '!=', null)
    );
    
    return collectionData(q, { idField: 'id' });
  }
  
  // Create a check-in/check-out record
  recordAttendance(employeeId: string, isCheckIn: boolean, location: Ubicacion): Promise<any> {
    const recordType = isCheckIn ? 'ingreso' : 'salida';
    const registrosRef = collection(this.firestore, 'registros-asistencia');
    
    return addDoc(registrosRef, {
      empleadoId: employeeId,
      fecha: new Date(),
      tipo: recordType,
      ubicacion: location
    });
  }
  
  // Generate attendance report for a date range
  generateAttendanceReport(startDate: Date, endDate: Date): Observable<any[]> {
    const registrosRef = collection(this.firestore, 'registros-asistencia');
    const q = query(
      registrosRef,
      where('fecha', '>=', startDate),
      where('fecha', '<=', endDate),
      orderBy('fecha', 'asc')
    );
    
    return collectionData(q, { idField: 'id' });
  }
}