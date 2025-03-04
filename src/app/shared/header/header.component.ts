import { Component, Input, OnInit, inject, HostListener } from '@angular/core';
import { LabelComponent } from '../label/label.component';
import { AuthService } from './../../../app/services/auth.service';
import { ButtonComponent } from '../button/button.component';
import { Auth, authState, User } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DropdownComponent } from '../dropdown/dropdown.component';
import { ModalComponent } from '../modal/modal.component';

export interface CustomUser extends User {
  uid: string;
  email: string | null;
  displayName: string | null;
  rol?: string | null;
  }

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    ButtonComponent,
    LabelComponent,
    CommonModule,
    DropdownComponent,
    ModalComponent,
    ButtonComponent
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {

  @Input() brandDesktop: String = './assets/img/serveis_logo-h.jpg';
  @Input() brandMobile: String = './assets/img/serveis_logo-h.jpg';

  rolMap: { [key: string]: { icon: string; color: string } } = {
    'Empleado': { icon: 'user-md', color: '#007bff' },
    'Administrador': { icon: 'user', color: '#28a745' }
  };  

  isMobile = false;
  loggedUser = true;
  email: string | null = null;
  name: string | null = null;
  rol: string | null = null;
  isModalOpen: boolean = false;

  private auth: Auth = inject(Auth);
  readonly authState$ = authState(this.auth);
  private _router = inject(Router);
  private authservice = inject(AuthService);
  afs: any;

  getMenuItems(item: void): { label: string, icon?: string, subItems?: any[], path?: string, disabled: boolean, callback?: () => void } [] {
    return [
      { label: 'Mi cuenta', icon: 'user', path: '/login', disabled: false },
      { label: 'Nuevo registro', icon: 'folder-plus', path: '/register', disabled: false },
      { label: 'Gestionar permisos', icon: 'user-lock', path: '/', disabled: true },
      { label: 'Delegar cuenta', icon: 'people-arrows', path: '/', disabled: true },
      { label: 'Cerrar sesión', icon: 'right-from-bracket', disabled: false, callback: () => this.openModal() }
    ]
  }

  dropdownPosition = { top: '45px', left: '-165px' };

  // Listen for window resize events
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkIfMobile(event.target.innerWidth);
  }

  ngOnInit(): void {
    this.authState$.subscribe((user: CustomUser | null) => {
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

    this.checkIfMobile(window.innerWidth);
  }

  checkIfMobile(width: number): void {
    this.isMobile = width < 768; 
  }

  // Open the modal for confirmation
  openModal(): void {
    this.isModalOpen = !this.isModalOpen;
  }

  onConfirm() {
    this.isModalOpen = false;
    this.logOut();
  }

  async logOut(): Promise<void> {
    try {
      await this.authservice.logOut();
      this._router.navigateByUrl('/login');
    } catch (error) {
        console.log(error);
    }
  }  
}
