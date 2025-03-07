import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { CheckAttendanceComponent } from '../../components/check-attendance/check-attendance.component';
import { EmployeeListComponent } from '../../components/employee-list/employee-list.component';
import { HeaderComponent } from './../../shared/header/header.component';
import { LabelComponent } from 'src/app/shared/label/label.component';

@Component({
  selector: 'app-home',
  imports: [
    CheckAttendanceComponent,
    EmployeeListComponent,
    RouterOutlet, 
    HeaderComponent,
    CommonModule,
    LabelComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  title = 'gestor de empleados';
  imgSrc = './assets/img/serveis_logo-h.jpg';
  isMobile: boolean = false;
  currentView: 'list' | 'profile' | 'check-attendance' | 'update' = 'list';

  constructor(private router: Router) {}
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkIfMobile(event.target.innerWidth);
  }

  ngOnInit(): void {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.determineCurrentView(event.url);
      }
    });
    this.checkIfMobile(window.innerWidth);
  }

  checkIfMobile(width: number): void {
    this.isMobile = width < 768;
  }

  determineCurrentView(url: string): void {
    if (url.includes('/profile/')) {
      this.currentView = 'profile';
    } else if (url.includes('/check-attendance')) {
      this.currentView = 'check-attendance';
    } else if (url.includes('/actualizar/')) {
      this.currentView = 'update';
    } else {
      this.currentView = 'list';
    }
  }

  shouldShowPanel(panel: 'list' | 'detail' | 'check-attendance' | 'update'): boolean {
    return this.isMobile ? this.currentView === panel : true;
  }

  shouldShowMainPanel(): boolean {
    return this.isMobile ? this.currentView !== 'list' : true;
  }
}
