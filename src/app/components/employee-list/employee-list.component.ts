import { Component, OnInit, inject, Input, HostListener } from '@angular/core';
import { ItemComponent } from 'src/app/shared/item/item.component';
import { LabelComponent } from 'src/app/shared/label/label.component';
import { Empleado } from 'src/app/models/employee';
import { Auth, authState, User } from '@angular/fire/auth';
import { Observable, map, startWith, combineLatest, of, switchMap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CardComponent } from 'src/app/shared/card/card.component';
import { BadgeComponent } from 'src/app/shared/badge/badge.component';
import { ButtonComponent } from 'src/app/shared/button/button.component';
import { NavbarComponent } from 'src/app/shared/navbar/navbar.component';
import { DropdownComponent } from 'src/app/shared/dropdown/dropdown.component';
import { FormControl } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { ModalComponent } from 'src/app/shared/modal/modal.component';
import { AttendanceService } from './../../services/attendance.service';
import { NotificationService } from './../../services/notificacion.service';
import { AuthService } from 'src/app/services/auth.service';

export interface CustomUser extends User {
  uid: string;
  email: string | null;
  displayName: string | null;
  rol?: string | null;
}

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [
    ItemComponent,
    LabelComponent,
    CommonModule,
    CardComponent,
    BadgeComponent,
    ButtonComponent,
    NavbarComponent,
    DropdownComponent,
    ReactiveFormsModule,
    ModalComponent
  ],
  templateUrl: './employee-list.component.html',
  styleUrl: './employee-list.component.scss'
})


export class EmployeeListComponent implements OnInit {

  empleado!: Empleado[];
  empleados$!: Observable<Empleado[]>;
  loggedUser = true;
  isMobile!: boolean;
  email: string | null = null;
  name: string | null = null;
  rol: string | null = null;
  filteredEmpleados$!: Observable<Empleado[]>;
  searchControl = new FormControl('');
  selectedCategory: string = '';
  medCategories!: boolean;
  selectedItemId: string | null = null;
  isModalOpen: boolean = false;
  afs: any;

  onCardSelected(data: { id: string }) {
    this.selectedItemId = data.id;
  }

  private auth: Auth = inject(Auth);
  private authservice = inject(AuthService);
  readonly authState$ = authState(this.auth);
  
  @Input() type?: 'flex' | 'grid' = 'flex';
  @Input() direction?: 'horizontal' | 'vertical' = 'horizontal';

  rolMap: { [key: string]: { icon: string; color: string } } = {
    'Empleado': { icon: 'user-md', color: '#007bff' },
    'Administrador': { icon: 'user', color: '#28a745' }
  };  

  // Función que devuelve un array en lugar del array per-sé
  getMenuItems(data: Empleado): { label: string, icon?: string, subItems?: any[], path?: string, disabled: boolean, callback?: () => void } [] {
    return [
      { label: 'Ver detalle', icon: 'file-lines', disabled: false, callback: () => this.onItemSelected(data) },
      { label: 'Editar', icon: 'pencil', disabled: false, callback: () => this.navigateToEdit(data) },
      { label: 'Destacar', icon: 'star', disabled: true },
      { label: 'Gestionar permisos', icon: 'user-lock', disabled: true },
      { label: 'Asociar a empleado', icon: 'link', disabled: true },
      { label: 'Eliminar', icon: 'trash', disabled: false, callback: (event?: MouseEvent) => this.openModal(event, { id: data.id })  }
    ]
  }

  getEmpleadoOptions(item: void): { label: string, icon?: string, subItems?: any[], path?: string, disabled: boolean, callback?: () => void } [] {
    return [
      { label: 'Empleado manual', icon: 'file-lines', path: '/check-attendance', disabled: false },
      { label: 'Empleado QR', icon: 'qrcode', path: '/scan', disabled: false },
    ]
  }
  
  dropdownPosition = { top: '35px', left: '-170px' };
  splitButtonPosition = { top: '45px', left: '-160px' };

  servicioItems = Object.keys(this.rolMap).map(key => {
    return {
      label: key,
      icon: this.rolMap[key].icon,
      color: this.rolMap[key].color,
      path: `/categories/${key}`,
      selectable: false,
    };
  });

  constructor(
    private attendanceService: AttendanceService, 
    private notificacionService: NotificationService, 
    private router: Router,
  ) {}

  // Notificaciones
  triggerSuccess() {
    this.notificacionService.addNotification('Empleado eliminado!', 'danger');
  }

  triggerError() {
    this.notificacionService.addNotification('Error al eliminar empleado', 'warning');
  }

  ngOnInit(): void {
      this.authState$.subscribe(user => {
        if (user) {
          this.email = user.email;
          this.name = user.displayName;
          // Fetch role from Firestore
          this.authservice.getUserData(user.uid).subscribe(userData => {
            if (userData) {
              this.rol = userData['rol'] || null;
            }
          });
        } else {
          this.email = null;
          this.name = 'Usuario';
          this.rol = null;
        }
      });
  
    this.authState$.subscribe(user => {
      if (user) {
        this.empleados$ = this.authState$.pipe(
          switchMap((user) => {
            if (user) {
              return this.attendanceService.getEmpleadosByUserId(user.uid).pipe(
                startWith([])
              );
            }
            return of([]);
          })
        );        
        this.filteredEmpleados$ = combineLatest([
          this.searchControl.valueChanges.pipe(startWith('')),
          this.empleados$,
        ]).pipe(
          map(([searchTerm, empleados]) =>
            empleados.filter(empleado =>
              empleado.nombre.toLowerCase().includes((searchTerm ?? '').toLowerCase()) &&
              (this.selectedCategory === '' || empleado.servicio === this.selectedCategory)
            )
          )
        );
      }
    }
  );
    this.checkIfMobile(window.innerWidth);
  }

  // Listen for window resize events
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkIfMobile(event.target.innerWidth);
  }

  checkIfMobile(width: number): void {
    this.isMobile = width < 768; 
  }

  onItemSelected(item: Empleado): void {
    this.router.navigate([`/employees/profile/${item.id}`]);
  }

  navigateToEdit(item: Empleado): void {
    this.router.navigate([`/actualizar/${item.id}`]);
  }

  async navigateToDelete(item: Empleado): Promise<void> {
    try {
      await this.attendanceService.deleteEmpleado(item.id);
    } catch (error) {
      console.error('Error deleting empleado', error);
    }
  }

 // Search & filter
  onCategorySelected(servicio: string): void {
    this.selectedCategory = servicio;
    this.filteredEmpleados$ = this.filterEmpleados(this.searchControl.value || '', this.selectedCategory);
  }

  filterEmpleados(searchTerm: string, servicio: string): Observable<Empleado[]> {
    const term = searchTerm.toLowerCase() || '';
    return this.empleados$.pipe(
      map(empleados => empleados.filter(empleado =>
        empleado.nombre.toLowerCase().includes(term) &&
        (servicio === '' || empleado.servicio === servicio)
      ))
    );
  }

  getIconForServicio(servicio: string): string {
    return this.rolMap[servicio]?.icon || 'question-circle';
  }

  getColorForServicio(servicio: string): string {
    return this.rolMap[servicio]?.color || 'gray';
  }

  trackByFn(index: number, item: Empleado): string {
    return item.id;
  }

  showMedCategories(event: any) {
    this.medCategories = !this.medCategories;
  }

  // Open the modal and store the item
  openModal(event: MouseEvent | undefined, data: { id: string }) {
    event?.stopPropagation();
    this.selectedItemId = data.id;;
    this.isModalOpen = true;
  }
  
  // Handle the confirm action
  async onConfirm(data: { id: string }): Promise<void> {
    this.selectedItemId = data.id;;
    this.isModalOpen = false;
    
    if (this.selectedItemId) {
      try {
        await this.attendanceService.deleteEmpleado(this.selectedItemId);
        this.router.navigate(['/']);
        this.triggerSuccess();
      } catch (error) {
        this.triggerError();
      } finally {
        this.selectedItemId = null;
      }
    }
  }  
}
