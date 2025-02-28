import { Injectable, inject } from '@angular/core';
import { Firestore, addDoc, collection, collectionData, deleteDoc, doc, getDoc, getDocs, query, updateDoc, where } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Empleado } from '../models/employee';

const PATH = 'empleados'; // The Firestore collection path for empleados

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private _firestore = inject(Firestore); // Firebase Firestore instance injected

  private _collection = collection(this._firestore, PATH); // Reference to 'empleados' collection

  // Get all employees
  getEmpleados(): Observable<Empleado[]> {
    return collectionData(this._collection, { idField: 'id' }) as Observable<Empleado[]>;
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
