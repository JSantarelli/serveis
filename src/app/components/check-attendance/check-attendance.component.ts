// check-attendance.component.ts
import { Component, OnInit } from '@angular/core';
import { Map, tileLayer, marker, icon } from 'leaflet';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AuthService } from '../../services/auth.service';
import { Empleado, Ubicacion, Asistencia } from '../../models/employer';
// import { ToastrService } from 'ngx-toastr';
import { formatDate } from '@angular/common';

@Component({
  selector: 'app-check-attendance',
  templateUrl: './check-attendance.component.html',
  styleUrls: ['./check-attendance.component.scss']
})
export class CheckAttendanceComponent implements OnInit {
  map: Map;
  currentLocation: Ubicacion = null;
  currentEmployee: Empleado = null;
  todayAttendance: Asistencia = null;
  isLoading = false;
  todayDate: Date = new Date();
  
  constructor(
    private firestore: AngularFirestore,
    private authService: AuthService,
    private toastr: ToastrService
  ) {}
  
  ngOnInit(): void {
    this.initMap();
    this.getCurrentPosition();
    this.loadEmployeeData();
  }
  
  initMap(): void {
    this.map = new Map('attendance-map').setView([0, 0], 2);
    tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);
  }
  
  getCurrentPosition(): void {
    this.isLoading = true;
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.currentLocation = {
            latitud: position.coords.latitude,
            longitud: position.coords.longitude,
            timestamp: new Date()
          };
          
          // Update map with current location
          this.map.setView([this.currentLocation.latitud, this.currentLocation.longitud], 15);
          marker([this.currentLocation.latitud, this.currentLocation.longitud], {
            icon: icon({
              iconUrl: 'assets/marker-icon.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34]
            })
          }).addTo(this.map)
            .bindPopup('Tu ubicación actual')
            .openPopup();
            
          this.isLoading = false;
        },
        (error) => {
          console.error('Error getting location', error);
          this.toastr.error('No se pudo obtener tu ubicación. Por favor, habilita los permisos de ubicación.');
          this.isLoading = false;
        }
      );
    } else {
      this.toastr.error('Tu navegador no soporta geolocalización');
      this.isLoading = false;
    }
  }
  
  loadEmployeeData(): void {
    this.authService.getCurrentUser().subscribe(user => {
      if (user && user.uid) {
        this.firestore.collection('empleados')
          .doc<Empleado>(user.uid)
          .valueChanges()
          .subscribe(employee => {
            this.currentEmployee = employee;
            this.checkTodayAttendance();
          });
      }
    });
  }
  
  checkTodayAttendance(): void {
    if (!this.currentEmployee) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find today's attendance record
    this.todayAttendance = this.currentEmployee.historialAsistencia.find(record => {
      const recordDate = new Date(record.fecha);
      recordDate.setHours(0, 0, 0, 0);
      return recordDate.getTime() === today.getTime();
    });
    
    // If no attendance record for today, create one
    if (!this.todayAttendance) {
      this.todayAttendance = {
        fecha: new Date(),
        estado: 'Ausente'
      };
    }
  }
  
  checkIn(): void {
    if (!this.currentLocation) {
      this.toastr.warning('Espera a que se cargue tu ubicación');
      return;
    }
    
    this.isLoading = true;
    
    // Create a new attendance record if needed
    if (!this.todayAttendance) {
      this.todayAttendance = {
        fecha: new Date(),
        estado: 'Presente',
        ingreso: { ...this.currentLocation }
      };
      this.currentEmployee.historialAsistencia.push(this.todayAttendance);
    } else {
      // Update existing record
      this.todayAttendance.ingreso = { ...this.currentLocation };
      this.todayAttendance.estado = 'Presente';
    }
    
    // Update employee current location
    this.currentEmployee.ubicacionActual = { ...this.currentLocation };
    
    // Update in Firestore
    this.firestore.collection('empleados').doc(this.currentEmployee.id).update({
      historialAsistencia: this.currentEmployee.historialAsistencia,
      ubicacionActual: this.currentEmployee.ubicacionActual
    })
    .then(() => {
      this.toastr.success('Ingreso registrado correctamente');
      this.isLoading = false;
      
      // Add a separate check-in record to a dedicated collection for easier querying
      this.firestore.collection('registros-asistencia').add({
        empleadoId: this.currentEmployee.id,
        nombre: this.currentEmployee.nombre + ' ' + this.currentEmployee.apellido,
        fecha: new Date(),
        tipo: 'ingreso',
        ubicacion: this.currentLocation
      });
    })
    .catch(error => {
      console.error('Error al registrar ingreso', error);
      this.toastr.error('Error al registrar ingreso');
      this.isLoading = false;
    });
  }
  
  checkOut(): void {
    if (!this.currentLocation) {
      this.toastr.warning('Espera a que se cargue tu ubicación');
      return;
    }
    
    if (!this.todayAttendance || !this.todayAttendance.ingreso) {
      this.toastr.warning('No puedes registrar salida sin antes haber registrado ingreso');
      return;
    }
    
    this.isLoading = true;
    
    // Calculate hours worked
    const inTime = new Date(this.todayAttendance.ingreso.timestamp).getTime();
    const outTime = new Date().getTime();
    const hoursWorked = (outTime - inTime) / (1000 * 60 * 60);
    
    // Update attendance record
    this.todayAttendance.salida = { ...this.currentLocation };
    this.todayAttendance.horasTrabajadas = parseFloat(hoursWorked.toFixed(2));
    
    // Calculate overtime (assuming 8-hour workday)
    if (hoursWorked > 8) {
      this.todayAttendance.horasExtras = parseFloat((hoursWorked - 8).toFixed(2));
    }
    
    // Clear current location as employee is no longer working
    this.currentEmployee.ubicacionActual = null;
    
    // Update in Firestore
    this.firestore.collection('empleados').doc(this.currentEmployee.id).update({
      historialAsistencia: this.currentEmployee.historialAsistencia,
      ubicacionActual: null
    })
    .then(() => {
      this.toastr.success('Salida registrada correctamente');
      this.isLoading = false;
      
      // Add a separate check-out record
      this.firestore.collection('registros-asistencia').add({
        empleadoId: this.currentEmployee.id,
        nombre: this.currentEmployee.nombre + ' ' + this.currentEmployee.apellido,
        fecha: new Date(),
        tipo: 'salida',
        ubicacion: this.currentLocation,
        horasTrabajadas: this.todayAttendance.horasTrabajadas,
        horasExtras: this.todayAttendance.horasExtras || 0
      });
    })
    .catch(error => {
      console.error('Error al registrar salida', error);
      this.toastr.error('Error al registrar salida');
      this.isLoading = false;
    });
  }
  
  refreshLocation(): void {
    this.getCurrentPosition();
  }
}