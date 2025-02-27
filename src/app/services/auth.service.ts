// auth.service.ts
import { Injectable } from '@angular/core';
import { Auth, authState, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from '@angular/fire/auth';
import { Firestore, doc, getDoc, onSnapshot, DocumentReference, setDoc } from '@angular/fire/firestore';
import { Observable, from, of } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { Empleado } from '../models/employer';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  
  constructor(
    private auth: Auth,
    private firestore: Firestore
  ) {}
  
  getCurrentUser() {
    return authState(this.auth);
  }
  
  getEmployeeById(id: string): Observable<Empleado> {
    const docRef = doc(this.firestore, `empleados/${id}`);
    
    return new Observable<Empleado>(observer => {
      const unsubscribe = onSnapshot(docRef, (snapshot) => {
        const data = snapshot.data() as Empleado;
        if (data) {
          observer.next({ id: snapshot.id, ...data });
        } else {
          observer.next(null);
        }
      }, error => {
        observer.error(error);
      });
      
      // Return the unsubscribe function for cleanup
      return unsubscribe;
    });
  }
  
  login(email: string, password: string): Observable<any> {
    return from(signInWithEmailAndPassword(this.auth, email, password));
  }
  
  register(email: string, password: string, empleadoData: Partial<Empleado>): Observable<any> {
    return from(createUserWithEmailAndPassword(this.auth, email, password)).pipe(
      switchMap(credentials => {
        const id = credentials.user.uid;
        const docRef = doc(this.firestore, `empleados/${id}`);
        const data: Partial<Empleado> = {
          ...empleadoData,
          id,
          email,
          fechaAlta: new Date(),
          estado: 'Activo',
          historialAsistencia: [],
          licencias: [],
          pedidosInsumos: [],
          recibos: [],
          notificaciones: []
        };
        
        return from(setDoc(docRef, data)).pipe(
          map(() => credentials)
        );
      })
    );
  }
  
  logout(): Observable<void> {
    return from(signOut(this.auth));
  }
  
  // Get current user's role
  getCurrentUserRole(): Observable<string> {
    return this.getCurrentUser().pipe(
      switchMap(user => {
        if (!user) return of(null);
        return this.getEmployeeById(user.uid).pipe(
          map(employee => employee ? employee.rol : null)
        );
      })
    );
  }
}