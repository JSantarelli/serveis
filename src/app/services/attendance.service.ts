import { Injectable, OnInit, inject } from '@angular/core';
import { Firestore, addDoc, collection, collectionData, deleteDoc, doc, getDoc, getDocs, query, updateDoc, where } from '@angular/fire/firestore';
import { catchError, map, Observable, of, switchMap } from 'rxjs';
import { Empleado } from '../models/employee';
import { Auth, authState, User } from '@angular/fire/auth';
import { AuthService } from 'src/app/services/auth.service';

const PATH = 'empleados'; // The Firestore collection path for empleados
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
  private _firestore = inject(Firestore); // Firebase Firestore instance injected
  private _collection = collection(this._firestore, PATH); // Reference to 'empleados' collection
  private authservice = inject(AuthService);
  private auth: Auth = inject(Auth);
  readonly authState$ = authState(this.auth);
  rol: string | null = null;

  ngOnInit(): void {
    this.authState$.subscribe(user => {
      if (user) {
        // Fetch role from Firestore
        this.authservice.getUserData(user.uid).subscribe(userData => {
          if (userData) {
            this.rol = userData['rol'] || null;
          }
        });
      }
    });
  }

  getEmpleados(user: CustomUser | null): Observable<Empleado[]> {
    // If no user, return empty array
    if (!user) {
      return of([]);
    }
  
    // Fetch user data to confirm admin role
    return this.authservice.getUserData(user.uid).pipe(
      map(userData => {
        // Check if user has admin role
        if (userData?.['rol'] === 'administrador') {
          console.log('Admin role detected, retrieving all records');
          // If user is an admin, retrieve all records
          return collectionData(this._collection, { idField: 'id' }) as Observable<Empleado[]>;
        }
  
        // For non-admin users, retrieve only their own records
        const q = query(this._collection, where('userId', '==', user.uid));
        return collectionData(q, { idField: 'id' }) as Observable<Empleado[]>;
      }),
      // Flatten the nested observable
      switchMap(result => result),
      // Fallback to empty array if anything goes wrong
      catchError(() => of([]))
    );
  }
  
  // Get a specific employee by ID
  async getEmpleado(id: string): Promise<Empleado | undefined> {
    try {
      const snapshot = await getDoc(this.document(id));
      return snapshot.exists() ? (snapshot.data() as Empleado) : undefined;
    } catch (error) {
      console.error('Error fetching employee:', error);
      return undefined;
    }
  }

  // Search employees by name
  async searchEmpleadoByQuery(name: string): Promise<Empleado[]> {
    const q = query(
      this._collection,
      where('fullName', '>=', name),
      where('fullName', '<=', name + '\uf8ff') // Range for searching
    );
    const querySnapshot = await getDocs(q);
    let empleados: Empleado[] = [];
    querySnapshot.forEach((doc) => {
      empleados.push({ id: doc.id, ...doc.data() } as Empleado); // Add each employee to the list
    });
    return empleados;
  }

  // Create a new employee record
  createEmpleado(empleado: Empleado) {
    return addDoc(this._collection, empleado);
  }

  // Update an existing employee record by ID
  updateEmpleado(id: string, empleado: Empleado) {
    return updateDoc(this.document(id), { ...empleado });
  }

  // Delete an employee by ID
  deleteEmpleado(id: string) {
    return deleteDoc(this.document(id));
  }

  // Get employees by user ID (filtering)
  getEmpleadosByUserId(userId: string): Observable<Empleado[]> {
    const q = query(this._collection, where('userId', '==', userId));
    return collectionData(q, { idField: 'id' }) as Observable<Empleado[]>;
  }

  // Helper method to get document reference by ID
  private document(id: string) {
    return doc(this._firestore, `${PATH}/${id}`);
  }
}
