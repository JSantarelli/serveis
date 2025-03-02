// app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Components
import { CheckAttendanceComponent } from './components/check-attendance/check-attendance.component';
import { EmployeeMapComponent } from './components/employee-map/employee-map.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { EmployeeListComponent } from './components/employee-list/employee-list.component';
import { EmployeeProfileComponent } from './components/employee-profile/employee-profile.component';
import { LoginComponent} from './components/auth/login/login.component'
import { RegisterComponent } from './components/auth/register/register.component';
import { ForgotPasswordComponent } from './components/auth/forgot-password/forgot-password.component';
import { AttendanceReportComponent } from './components/reports/attendance-report/attendance-report.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { HomeComponent } from './components/home/home.component';


export const routes: Routes = [
  // Auth routes
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  
  // Main routes (protected by auth)
  { 
    path: '', component: HomeComponent,
    // canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: '/employees', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'check-attendance', component: CheckAttendanceComponent },
      
      // Employee routes
      { 
        path: 'employees', 
        children: [
          { path: 'list', component: EmployeeListComponent },
          { path: 'profile/:id', component: EmployeeProfileComponent }
        ] 
      },
      
      // Admin routes (protected by role)
      { 
        path: 'admin', 
        children: [
          { path: 'map', component: EmployeeMapComponent },
          { path: 'reports', component: AttendanceReportComponent }
        ] 
      }
    ]
  },
  
  // Wildcard route
  { path: '**', component: NotFoundComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }