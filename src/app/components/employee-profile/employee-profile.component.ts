import { Component, OnInit, AfterViewInit, HostListener, ViewChild, ElementRef } from '@angular/core';
import { Empleado } from 'src/app/models/employee';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationService } from './../../services/notificacion.service';
import { AttendanceService } from 'src/app/services/attendance.service';
import { Location } from '@angular/common';
import { CardComponent } from 'src/app/shared/card/card.component';
import { BadgeComponent } from 'src/app/shared/badge/badge.component';
import { ButtonComponent } from 'src/app/shared/button/button.component';
import { ModalComponent } from 'src/app/shared/modal/modal.component';
import { LabelComponent } from 'src/app/shared/label/label.component';
import { SwitcherComponent } from 'src/app/shared/switcher/switcher.component';
import { DropdownComponent } from 'src/app/shared/dropdown/dropdown.component';
import * as L from 'leaflet';

@Component({
    selector: 'app-employee-profile',
    templateUrl: './employee-profile.component.html',
    styleUrls: ['./employee-profile.component.scss'],
    standalone: true,
    imports: [
      BadgeComponent,
      ButtonComponent,
      CardComponent,
      ModalComponent,
      LabelComponent,
      SwitcherComponent,
      DropdownComponent
    ]
})

export class EmployeeProfileComponent implements OnInit, AfterViewInit {
  empleado!: Empleado | null;
  id!: string;
  editableIcon!: string;
  editableColor!: string;
  qrCodeUrl?: string;
  disabled = false;
  isMobile!: boolean;
  isModalOpen: boolean = false;
  modalDelete: boolean = false;
  selectedFile?: string;
  selectedItemId: string | null = null;
  map!: L.Map;
  checkInMarker: any;
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;


  categoriaMap: { [key: string]: { icon: string; color: string } } = {
    'Medicina General': { icon: 'user-md', color: '#007bff' }, // Blue
    'Pediatría': { icon: 'baby', color: '#28a745' }, // Green
    'Ginecología y Obstetricia': { icon: 'venus', color: '#e83e8c' }, // Pink
    'Cardiología': { icon: 'heart', color: '#dc3545' }, // Red
    'Dermatología': { icon: 'spa', color: '#fd7e14' }, // Orange
    'Neurología': { icon: 'brain', color: '#6f42c1' }, // Purple
    'Psiquiatría': { icon: 'comments', color: '#20c997' }, // Teal
    'Endocrinología': { icon: 'balance-scale', color: '#ffc107' }, // Yellow
    'Gastroenterología': { icon: 'stethoscope', color: '#795548' }, // Brown
    'Traumatología y Ortopedia': { icon: 'crutch', color: '#6c757d' }, // Gray
    'Oftalmología': { icon: 'eye', color: '#17a2b8' }, // Cyan
    'Otorrinolaringología': { icon: 'head-side-cough', color: '#6610f2' }, // Indigo
    'Urología': { icon: 'x-ray', color: '#007bff' }, // Blue
    'Neumología': { icon: 'lungs', color: '#87ceeb' }, // Light Blue
    'Oncología': { icon: 'ribbon', color: '#6f42c1' }, // Purple
    'Nutrición y Dietética': { icon: 'utensils', color: '#a2d729' }, // Lime
    'Fisiatría y Rehabilitación': { icon: 'dumbbell', color: '#fd7e14' }, // Orange
    'Odontología': { icon: 'tooth', color: '#5fc8db' } // White
  };

  // Función que devuelve un array en lugar del array per-sé
  getMenuItems(data: Empleado): { label: string, icon?: string, subItems?: any[], path?: string, disabled: boolean, callback?: () => void } [] {
    return [
      { label: 'Editar', icon: 'user', disabled: false, callback: () => this.navigateToEdit(data) },
      { label: 'Gestionar permisos', icon: 'star', disabled: true },
      { label: 'Eliminar', icon: 'trash', disabled: false, 
        callback: (event?: MouseEvent) => {
          this.openDeleteModal(event);
      },
    }
    ]
  }

  dropdownPosition = { top: '35px', left: '-190px' };

  constructor(
    private route: ActivatedRoute,
    private empleadoService: AttendanceService,
    private router: Router,
    private location: Location,
    private notificationService: NotificationService
  ) {}

  // Notificaciones
  triggerSuccess() {
    this.notificationService.addNotification('Empleado eliminado con éxito!', 'danger');
  }

  triggerError() {
    this.notificationService.addNotification('Error al generar el empleado', 'warning');
  }

  ngAfterViewInit() {
    // Give the DOM time to fully render
    setTimeout(() => {
      // If employee data is already loaded, show the location
      if (this.empleado?.ubicacionActual?.latitud != null && 
        this.empleado?.ubicacionActual?.longitud != null) {
          this.getCheckInLocation();
      }
    }, 200);
      console.log('ngAfterViewInit');
      setTimeout(() => {
        console.log('ngAfterViewInit timeout firing');
      }, 200);
  }

  ngOnInit(): void {
    console.log('ngOnInit');
    this.route.params.subscribe(params => {
      this.id = params['id'];
      if (this.id) {
        this.fetchDetails(this.id);
        console.log(`ID: ${this.id}`);
      } else {
        console.error('ID not found in route parameters');
      }
    });
    this.checkIfMobile(window.innerWidth)
  }

  // Listen for window resize events
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkIfMobile(event.target.innerWidth);
  }

  checkIfMobile(width: number): void {
    this.isMobile = width < 768; 
  }

  generateQRCode(data: any) {
    if (data) {
      const formattedData = 
      `Nombre: ${data.nombre}\nDescripción: ${data.rol}\nFecha: ${data.fecha}\nHora: ${data.hora}\nCategoria: ${data.estado}\nValidado: ${data.validado}\nEstado: ${data.estado}\nEmisor: ${data.cuil}\nAdjuntos: ${data.adjuntos}`;
      const encodedData = encodeURIComponent(formattedData);
      this.qrCodeUrl = `https://quickchart.io/qr?text=${encodedData}`;
    }
  }

  async fetchDetails(id: string) {
    this.initMap();

    if (id) {
      try {
        await this.loadEmpleado(id); 
        if (this.empleado) {
          this.generateQRCode(this.empleado);
          
          // Only try to show location if map is initialized
          if (this.map) {
            this.getCheckInLocation();
          }
        }
      } catch (error) {
        console.error('Error loading empleado:', error);
        this.empleado = null; 
      }
    } else {
      this.empleado = null;
    }
  }

  initMap(): void {
    if (!this.mapContainer || !this.mapContainer.nativeElement) {
      console.error('Map container element not available');
      return;
    }
    
    try {
      console.log('Initializing map with container:', this.mapContainer.nativeElement);
      
      // Check if map is already initialized
      if (this.map) {
        console.log('Map already initialized, skipping');
        return;
      }
      
      this.map = new L.Map(this.mapContainer.nativeElement).setView([0, 0], 2);
      
      // Map style   
      var Stadia_AlidadeSmooth = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png', {
        maxZoom: 20,
        attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
      });
      
      //titulo
      const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 4,
        attribution: '© OpenStreetMap contributors'
      });
      
      tiles.addTo(this.map);
      Stadia_AlidadeSmooth.addTo(this.map);
      
      // Invalidate size to handle any sizing issues
      setTimeout(() => {
        this.map.invalidateSize();
      }, 100);
      
      console.log('Map initialized successfully');
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }

  async loadEmpleado(id: string): Promise<void> {
    try {
      const empleado = await this.empleadoService.getEmpleado(id);
      this.empleado = empleado || null;
      this.generateQRCode(empleado);
    } catch (error) {
      this.empleado = null;
      console.error('Error fetching empleado:', error);
    }
  }

  getIconForCategoria(categoria: string): string {
    return this.categoriaMap[categoria]?.icon || 'question-circle';
  }

  getColorForCategoria(categoria: string): string {
    return this.categoriaMap[categoria]?.color || 'gray';
  }

  trackByFn(item: any): any {
    return item.id;
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/']);
    } 
  }

  navigateToEdit(item: Empleado): void {
    this.router.navigate([`/actualizar/${item.id}`]);
  }

  async navigateToDelete(item: Empleado): Promise<void> {
    try {
      await this.empleadoService.deleteEmpleado(item.id);
     this.router.navigate(['/']);
    } catch (error) {
      console.error('Error deleting empleado', error);
    }
  }

  openDeleteModal(event: MouseEvent | undefined) {
    event?.stopPropagation();
    this.modalDelete = true; 
  }

  openModal(file: string):void {
      this.selectedFile = file;
      this.isModalOpen = !this.isModalOpen;
  }

  async onConfirm(): Promise<void> {
    const itemId = this.id;

    if (itemId) {
      try {
        this.modalDelete = false;
        await this.empleadoService.deleteEmpleado(itemId);
        this.router.navigate(['/']);
        this.triggerSuccess();
      } catch (error) {
        this.triggerError();
      }
    }
  }

  getCheckInLocation(): boolean {
    if (!this.map) {
      console.error('Map not initialized');
      return false;
    }
    
    if (this.empleado?.ubicacionActual?.latitud != null && 
        this.empleado?.ubicacionActual?.longitud != null) {
      
      const lat = this.empleado.ubicacionActual.latitud;
      const lng = this.empleado.ubicacionActual.longitud;
      const timestamp = this.empleado.ubicacionActual.timestamp || new Date();
      
      console.log(`Setting map view to [${lat}, ${lng}]`);
      
      // Center the map on the check-in location
      this.map.setView([lat, lng], 15);
      
      // Clear any existing markers if needed
      if (this.checkInMarker) {
        this.map.removeLayer(this.checkInMarker);
      }
      
      // Add a marker for the check-in location
      this.checkInMarker = L.marker([lat, lng]).addTo(this.map)
        .bindPopup(`Check-in location at ${new Date(timestamp).toLocaleString()}`)
        .openPopup();
      
      return true;
    } else {
      console.log('No check-in location found for this employee');
      return false;
    }
  }

}
