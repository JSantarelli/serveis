// attendance.service.ts
import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Empleado, Asistencia, Ubicacion } from '../models/employer';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  
  constructor(private firestore: AngularFirestore) {}
  
  // Get today's attendance records for all employees
  getTodayAttendanceRecords(): Observable<any[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return this.firestore.collection('registros-asistencia', ref => 
      ref.where('fecha', '>=', today)
         .where('fecha', '<', tomorrow)
         .orderBy('fecha', 'desc')
    ).snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const data = a.payload.doc.data() as any;
        const id = a.payload.doc.id;
        return { id, ...data };
      }))
    );
  }
  
  // Get attendance history for a specific employee
  getEmployeeAttendanceHistory(employeeId: string): Observable<Asistencia[]> {
    return this.firestore.collection('empleados').doc<Empleado>(employeeId)
      .valueChanges()
      .pipe(
        map(employee => employee ? employee.historialAsistencia : [])
      );
  }
  
  // Get all employees currently checked in
  getCheckedInEmployees(): Observable<any[]> {
    return this.firestore.collection('empleados', ref => 
      ref.where('ubicacionActual', '!=', null)
    ).snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const data = a.payload.doc.data() as Empleado;
        const id = a.payload.doc.id;
        
        return { ...data, id };  // Correctly add the id to the returned object
      }))
    );
  }  
  
  // Create a check-in/check-out record
  recordAttendance(employeeId: string, isCheckIn: boolean, location: Ubicacion): Promise<any> {
    const recordType = isCheckIn ? 'ingreso' : 'salida';
    
    return this.firestore.collection('registros-asistencia').add({
      empleadoId: employeeId,
      fecha: new Date(),
      tipo: recordType,
      ubicacion: location
    });
  }
  
  // Generate attendance report for a date range
  generateAttendanceReport(startDate: Date, endDate: Date): Observable<any[]> {
    return this.firestore.collection('registros-asistencia', ref => 
      ref.where('fecha', '>=', startDate)
         .where('fecha', '<=', endDate)
         .orderBy('fecha', 'asc')
    ).snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const data = a.payload.doc.data() as any;
        const id = a.payload.doc.id;
        return { id, ...data };
      }))
    );
  }
}