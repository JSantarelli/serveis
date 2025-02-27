// employee-map.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Map, tileLayer, marker, icon, Marker } from 'leaflet';
import { AttendanceService } from '../../services/attendance.service';
import { Subscription } from 'rxjs';
import { Empleado } from '../../models/employer';

@Component({
    selector: 'app-employee-map',
    imports: [CommonModule],
    templateUrl: './employee-map.component.html',
    styleUrls: ['./employee-map.component.scss']
})
export class EmployeeMapComponent implements OnInit, OnDestroy {
  map: Map;
  employeeMarkers: Marker[] = [];
  employeesSubscription: Subscription;
  checkedInEmployees: any[] = [];
  isLoading = true;
  
  constructor(private attendanceService: AttendanceService) {}
  
  ngOnInit(): void {
    this.initMap();
    this.loadEmployeeLocations();
  }
  
  ngOnDestroy(): void {
    if (this.employeesSubscription) {
      this.employeesSubscription.unsubscribe();
    }
  }
  
  initMap(): void {
    this.map = new Map('employee-map').setView([-34.603722, -58.381592], 12); // Default to Buenos Aires
    tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);
  }
  
  loadEmployeeLocations(): void {
    this.isLoading = true;
    
    this.employeesSubscription = this.attendanceService.getCheckedInEmployees()
      .subscribe(employees => {
        this.checkedInEmployees = employees;
        this.updateMarkers();
        this.isLoading = false;
      });
  }
  
  updateMarkers(): void {
    // Clear existing markers
    this.employeeMarkers.forEach(m => m.remove());
    this.employeeMarkers = [];
    
    // Create markers for checked-in employees
    this.checkedInEmployees.forEach(employee => {
      if (employee.ubicacionActual) {
        const { latitud, longitud } = employee.ubicacionActual;
        
        // Create custom marker with employee info
        const employeeMarker = marker([latitud, longitud], {
          icon: icon({
            iconUrl: 'assets/person-marker.png',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
          })
        }).addTo(this.map);
        
        // Add popup with employee info
        employeeMarker.bindPopup(`
          <div class="employee-popup">
            <strong>${employee.nombre} ${employee.apellido}</strong>
            <p>${employee.rol}</p>
            <p class="text-muted">Último check-in: ${new Date(employee.ubicacionActual.timestamp).toLocaleString()}</p>
          </div>
        `);
        
        this.employeeMarkers.push(employeeMarker);
      }
    });
    
    // Adjust map view if we have markers
    if (this.employeeMarkers.length > 0) {
      const group = L.featureGroup(this.employeeMarkers);
      this.map.fitBounds(group.getBounds().pad(0.2));
    }
  }
  
  refreshLocations(): void {
    this.loadEmployeeLocations();
  }
}