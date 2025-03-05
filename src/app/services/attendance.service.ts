import { Injectable, OnInit, inject } from '@angular/core';
import { Firestore, addDoc, collection, collectionData, deleteDoc, doc, getDoc, getDocs, query, updateDoc, where } from '@angular/fire/firestore';
import { catchError, map, Observable, of, switchMap } from 'rxjs';
import { Empleado } from '../models/employee';
import { Auth, authState, User } from '@angular/fire/auth';
import { AuthService } from 'src/app/services/auth.service';

const PATH = 'empleados'; 
export interface CustomUser extends User {
  uid: string;
  email: string | null;
  displayName: string | null;
  rol?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AttendanceService implements OnInit {
  private _firestore = inject(Firestore); 
  private _collection = collection(this._firestore, PATH); 
  private authservice = inject(AuthService);
  private auth: Auth = inject(Auth);
  readonly authState$ = authState(this.auth);
  rol: string | null = null;

  ngOnInit(): void {
    this.authState$.subscribe(user => {
      if (user) {
        
        this.authservice.getUserData(user.uid).subscribe(userData => {
          if (userData) {
            this.rol = userData['rol'] || null;
          }
        });
      }
    });
  }

  getEmpleados(user: CustomUser | null): Observable<Empleado[]> {
    
    if (!user) {
      return of([]);
    }
  
    return this.authservice.getUserData(user.uid).pipe(
      map(userData => {
        if (userData?.['rol'] === 'administrador') {
          console.log('Admin role detected, retrieving all records');
          return collectionData(this._collection, { idField: 'id' }) as Observable<Empleado[]>;
        }
        const q = query(this._collection, where('userId', '==', user.uid));
        return collectionData(q, { idField: 'id' }) as Observable<Empleado[]>;
      }),
      switchMap(result => result),
      catchError(() => of([]))
    );
  }
    async getEmpleado(id: string): Promise<Empleado | undefined> {
    try {
      const snapshot = await getDoc(this.document(id));
      return snapshot.exists() ? (snapshot.data() as Empleado) : undefined;
    } catch (error) {
      console.error('Error fetching employee:', error);
      return undefined;
    }
  }
  
  async searchEmpleadoByQuery(name: string): Promise<Empleado[]> {
    const q = query(
      this._collection,
      where('fullName', '>=', name),
      where('fullName', '<=', name + '\uf8ff') 
    );
    const querySnapshot = await getDocs(q);
    let empleados: Empleado[] = [];
    querySnapshot.forEach((doc) => {
      empleados.push({ id: doc.id, ...doc.data() } as Empleado); 
    });
    return empleados;
  }

  createEmpleado(empleado: Empleado) {
    return addDoc(this._collection, empleado);
  }
  
  updateEmpleado(id: string, empleado: Empleado) {
    return updateDoc(this.document(id), { ...empleado });
  }

  deleteEmpleado(id: string) {
    return deleteDoc(this.document(id));
  }
  
  getEmpleadosByUserId(userId: string): Observable<Empleado[]> {
    const q = query(this._collection, where('userId', '==', userId));
    return collectionData(q, { idField: 'id' }) as Observable<Empleado[]>;
  }
  
  private document(id: string) {
    return doc(this._firestore, `${PATH}/${id}`);
  }
}
