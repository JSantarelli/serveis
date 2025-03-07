// check-attendance.component.ts
import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import L, { Map, tileLayer, marker, icon } from 'leaflet';
import { Firestore, doc, updateDoc, collection, addDoc } from '@angular/fire/firestore';
import { Empleado, Ubicacion, Asistencia } from '../../models/employee';
import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { AttendanceService,  } from './../../services/attendance.service';
import { Auth, authState, User } from '@angular/fire/auth';
import { LabelComponent } from 'src/app/shared/label/label.component';
import { BadgeComponent } from 'src/app/shared/badge/badge.component';
import { ButtonComponent } from 'src/app/shared/button/button.component';
import { Subscription } from 'rxjs';
import { SwitcherComponent } from 'src/app/shared/switcher/switcher.component';
import { Storage, ref, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage';
import { Location } from '@angular/common';
import { RequiredComponent } from 'src/app/shared/required/required.component';
import { CardComponent } from 'src/app/shared/card/card.component';
import { NotificationService } from './../../services/notificacion.service';
import { EmployeeListComponent } from '../employee-list/employee-list.component';
import { AuthService } from 'src/app/services/auth.service';

export interface CustomUser extends User {
  uid: string;
  email: string | null;
  displayName: string | null;
  rol?: string | null;
  }
  
export interface EmpleadoForm {
  nombre: FormControl<string>;
  apellido: FormControl<string>;
  dni: FormControl<string>;
  cuil: FormControl<string>;
  email: FormControl<string>;
  telefono: FormControl<string>;
  rol: FormControl<'Administrador' | 'Supervisor' | 'Empleado'>;
  servicio: FormControl<string>;
  fecha: FormControl<Date>;
  hora: FormControl<string>;
  estado: FormControl<'Activo' | 'Suspendido' | 'Baja'>;
  ubicacionActual: FormControl<Ubicacion | null>;
  adjuntos: FormControl<Array<string>>;
}

@Component({
  selector: 'app-check-attendance',
  templateUrl: './check-attendance.component.html',
  styleUrls: ['./check-attendance.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    LabelComponent,
    BadgeComponent,
    ButtonComponent,
    LabelComponent,
    SwitcherComponent,
    RequiredComponent,
    CommonModule,
    CardComponent,
    EmployeeListComponent
  ],
})
export class CheckAttendanceComponent implements OnInit, AfterViewInit {
  id!: string;
  currentLocation = true;
  loggedUser = true;
  isMobile = false;
  private subscription: Subscription = new Subscription();
  validado = true;
  registroId: string | null = null;
  empleado!: Empleado | null;
  hasChange: boolean = false;
  uploadedImages: string[] = [];
  uploadedFileNames: string[] = [];
  showConfirmMsg = false;
  showErrorMsg = false;
  hide = true;
  map!: L.Map;
  email: string | null = null;
  name: string | null = null;
  rol: string | null = null;
  checkInMarker: any;
  private auth: Auth = inject(Auth);
  private authservice = inject(AuthService);
  readonly authState$ = authState(this.auth);

  
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  
  checkIfMobile(width: number): void {
    this.isMobile = width < 768; 
  }

  constructor(
    private storage: Storage, 
    private firestore: Firestore,
    private _activatedRoute: ActivatedRoute,
    private router: Router,
    private location: Location,
    private notificationService: NotificationService,
    private empleadoService: AttendanceService,
  ) {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initMap();
    }, 1000);
  }
  // Notificaciones
  triggerSuccess() {
    this.notificationService.addNotification('Registro creado con éxito!', 'success');
  }

  triggerError() {
    this.notificationService.addNotification('Error al generar el registro', 'error');
  }

  ngOnInit(): void {
    this.authState$.subscribe((user: CustomUser | null) => {
      if (user) {
        this.email = user.email;
        this.name = user.displayName;
        
        // Patch basic user info to form immediately
        this.form.patchValue({
          nombre: user.displayName || '',
          email: user.email || ''
        });
        
        // Fetch additional role from Firestore
        this.authservice.getUserData(user.uid).subscribe(userData => {
          if (userData) {
            this.rol = userData['rol'] || null;
            
            // Update form with additional user data
            this.form.patchValue({
              rol: userData['rol'] || 'Empleado',
              // You can add other fields from userData here
              servicio: userData['servicio'] || 'BPN - Casa Central',
              apellido: userData['apellido'] || ''
            });
          }
        });
      } else {
        this.email = null;
        this.name = 'Usuario';
        this.rol = null;
        
        // Reset form when user logs out
        this.form.reset({
          rol: 'Empleado',
          estado: 'Activo',
          ubicacionActual: {
            latitud: null,
            longitud: null,
            timestamp: new Date()
          },
          adjuntos: []
        });
      }
    });

    this.checkIfMobile(window.innerWidth);
    this.registroId = this._activatedRoute.snapshot.paramMap.get('id');
  
    if (this.registroId) {
      this.loadRegistroData(this.registroId);
    }

    // this.setTitle();
    this.onCategoryChange();

    // Date
    const today = new Date();

    const formattedDate: any = today.toISOString().split('T')[0];
    this.form.controls['fecha'].setValue(formattedDate);  
  
    const hours = today.getHours().toString().padStart(2, '0');  
    const minutes = today.getMinutes().toString().padStart(2, '0');  
    const formattedTime = `${hours}:${minutes}`;  
    this.form.controls['hora'].setValue(formattedTime);

    // Map
    this.initMap();
    this.getCurrentLocation();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.form.get('adjuntos')?.value.forEach((url: string) => URL.revokeObjectURL(url));
  }

  async loadEmpleado(id: string): Promise<void> {
    try {
      const empleado = await this.empleadoService.getEmpleado(id);
      this.empleado = empleado || null;
      
      if (this.empleado) {
        // Patch form values after loading employee
        this.form.patchValue({
          nombre: this.empleado.nombre,
          apellido: this.empleado.apellido,
          servicio: this.empleado.servicio
        });
      }
    } catch (error) {
      this.empleado = null;
      console.error('Error fetching empleado:', error);
    }
  }

  async fetchDetails(id: string) {
    if (id) {
      try {
        await this.loadEmpleado(id); 
      } catch (error) {
        console.error('Error loading empleado:', error);
        this.empleado = null; 
      }
    } else {
      this.empleado = null;
    }
  }

  onCategoryChange() {
    const servicio = this.form.controls['servicio'].value;
    if (servicio) {
      const { icon, color } = this.categoriaMap[servicio];
      this.editableIcon = icon;
      this.editableColor = color;
      this.editableCategory = servicio;
    }
    this.hasChange = true;
  }

  // considerar utilizar un enum o crear una colección para especialidades
  categorias: string[] = [
    'Ingresos',
    'Egresos',
  ];
  
  categoriaMap: { [key: string]: { icon: string; color: string } } = {
    'Ingresos': { icon: 'right-to-bracket', color: '#007bff' },
    'Egresos': { icon: 'right-from-bracket', color: '#28a745' }
  };  

  // Properties for the Label component
  editableTitle: string = '';
  editableCategory: string = '';
  editableIcon: string = 'heart';
  editableColor: string = '';

  categoriaOptions = Object.keys(this.categoriaMap).map((key) => ({
    value: key,
    label: key.replace(/([A-Z])/g, ' $1').trim(),
  }));

  private _formBuilder = inject(FormBuilder).nonNullable;
  private _router = inject(Router);
  private _attendanceService = inject(AttendanceService);

  form = this._formBuilder.group<EmpleadoForm>({
    nombre: this._formBuilder.control(''),
    apellido: this._formBuilder.control(''),
    dni: this._formBuilder.control(''),
    cuil: this._formBuilder.control(''),
    email: this._formBuilder.control(''),
    telefono: this._formBuilder.control(''),
    rol: this._formBuilder.control('Empleado'), // You can map this from a different source if needed
    servicio: this._formBuilder.control(''),
    fecha: this._formBuilder.control(new Date(), Validators.required),
    hora: this._formBuilder.control('', Validators.required),
    estado: this._formBuilder.control('Activo'),
    ubicacionActual: this._formBuilder.control<Ubicacion | null>({
      latitud: null,
      longitud: null,
      timestamp: new Date()
    }, Validators.required),
    adjuntos: this._formBuilder.control([])
  });

  getEmpleadoControl() {
    return this.form.get('nombre');
  }

  getEmpleadoValue(): string | undefined {
    return this.getEmpleadoControl()?.value;
  }

  setEmpleadoValue(newValue: string): void {
    this.getEmpleadoControl()?.setValue(newValue);
  }

  async loadRegistroData(id: string) {
    try {
        const empleado = await this._attendanceService.getEmpleado(id);
        if (empleado) {
            this.form.patchValue({
                nombre: empleado.nombre,
                apellido: empleado.apellido,
                dni: empleado.dni,
                cuil: empleado.cuil,
                email: empleado.email,
                telefono: empleado.telefono,
                rol: empleado.rol,
                fecha: empleado.fecha,
                hora: empleado.hora,
                estado: empleado.estado,
                ubicacionActual: empleado.ubicacionActual,
            });
        }
    } catch (error) {
        console.error('Error loading empleado data:', error);
    }
}
  
  async createRegistro() {
    const user = await this.auth.currentUser;
  
    if (this.form.invalid) return;
  
    try {
      const registro = this.form.value as Empleado;
  
      // Adjuntos array (removes any invalid entries)
      registro.adjuntos = registro.adjuntos.filter((url: string) => this.isValidUrl(url));
  
      if (user) {
        registro.userId = user.uid;
      }
  
      if (!this.registroId) {
        await this._attendanceService.createEmpleado(registro);
      } else {
        await this._attendanceService.updateEmpleado(this.registroId, registro);
      }
      this._router.navigate(['/employees/']);
      this.triggerSuccess();
    } catch (error) {
      this.triggerError();
    }
  }
  
  isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }  

  async setFormValues(id: string) {
    try {
        const empleado = await this._attendanceService.getEmpleado(id);
        if (!empleado) return;

        this.form.setValue({
            nombre: empleado.nombre || '',
            apellido: empleado.apellido || '',
            dni: empleado.dni || '',
            cuil: empleado.cuil || '',
            email: empleado.email || '',
            telefono: empleado.telefono || '',
            rol: empleado.rol || 'Empleado',
            servicio: empleado.servicio || '',
            fecha: empleado.fecha || new Date(),
            hora: empleado.hora,
            estado: empleado.estado || 'Activo',
            ubicacionActual: {
              latitud: empleado.ubicacionActual?.latitud,
              longitud: empleado.ubicacionActual?.longitud,
              timestamp: empleado.ubicacionActual?.timestamp ?? new Date()
            },
            adjuntos: empleado.adjuntos
        });
    } catch (error) {
        console.error('Error setting form values', error);
    }
}

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/']);
    } 
  }

  cancel() {
    if (this.form) {
      this.form.reset();
    }
    this.router.navigate(['/']);
  }

  // Uploads
  uploadFiles(event: any) {
    const files: FileList = event.target.files;
    if (!files.length) return;

    Array.from(files).forEach((file: File) => {
      const filePath = `images/${Date.now()}_${file.name}`;
      const storageRef = ref(this.storage, filePath);
      const uploadTask = uploadBytesResumable(storageRef, file);
      this.uploadedFileNames.push(file.name);

      uploadTask.on('state_changed', {
        next: (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        },
        error: (error) => console.error('Upload error:', error),
        complete: async () => {
          try {
            const downloadURL = await getDownloadURL(storageRef);
            this.uploadedImages.push(downloadURL);
            this.form.get('adjuntos')?.setValue([...this.uploadedImages]);
            event.target.value = '';
            // Implementar notificación uploads
          } catch (error) {
            console.error('Error getting download URL:', error);
          }
        }
      });
    });
  }

  async saveImageMetadata(downloadURL: string, fileName: string) {
    const imagesCollection = collection(this.firestore, 'images');
    await addDoc(imagesCollection, {
      url: downloadURL,
      name: fileName,
      uploadedAt: new Date()
    });
  }

  removeFile(index: number): void {
    const fileArray: string[] = this.form.get('adjuntos')?.value || [];
    
    fileArray.splice(index, 1);
  
    this.form.get('adjuntos')?.setValue(fileArray);
  }
  trackByFn(index: number, item: string): string {
    return item; 
  }

  get adjuntosControl() {
    return this.form.get('adjuntos');
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
      
      // Call getCurrentLocation after map is initialized
      this.getCurrentLocation();
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }

  getCurrentLocation(): void {
    if (!this.map) {
      console.error('Map not initialized');
      return;
    }
    
    if (navigator.geolocation) {
      // Show loading indicator
      const loadingMessage = L.popup()
        .setLatLng(this.map.getCenter())
        .setContent('Locating you...')
        .openOn(this.map);
        
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Close loading message
          this.map?.closePopup();
          
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
  
          this.map?.setView([lat, lng], 15);
  
          const marker = L.marker([lat, lng]).addTo(this.map as L.Map)
            .bindPopup('Usted está aquí')
            .openPopup();
            
          const ubicacion: Ubicacion = {
            latitud: lat,
            longitud: lng,
            timestamp: new Date()
          };
  
          this.form.get('ubicacionActual')?.setValue(ubicacion);
          console.log('Location updated:', ubicacion);
        },
        (error) => {
          // Update loading message with error
          if (this.map) {
            L.popup()
              .setLatLng(this.map.getCenter())
              .setContent('Could not get your location: ' + error.message)
              .openOn(this.map);
          }
          console.error('Error getting location', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
      if (this.map) {
        L.popup()
          .setLatLng(this.map.getCenter())
          .setContent('Geolocation is not supported by this browser')
          .openOn(this.map);
      }
    }
  }
    
  // Add this method to manually trigger location update
  refreshLocation(): void {
    this.getCurrentLocation();
  }


  updateLocation(key: 'latitud' | 'longitud', event: Event) {
    const value = (event.target as HTMLInputElement).value;
    console.log(`${key} updated to`, value);
  }

  
  onSubmit() {
    const ubicacion = this.form.value.ubicacionActual;
  }
}