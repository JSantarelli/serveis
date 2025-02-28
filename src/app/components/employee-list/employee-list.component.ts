import { Component, OnInit } from '@angular/core';
import { AttendanceService } from './../../services/attendance.service';
import { Empleado } from './../../models/employee';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-employee-list',
  templateUrl: './employee-list.component.html',
  styleUrls: ['./employee-list.component.css'],
  standalone: true, // If it's standalone
  imports: [CommonModule],  // Add CommonModule here
})
export class EmployeeListComponent implements OnInit {
  empleados$: Observable<Empleado[]> = this.attendanceService.getEmpleados(); // Observable to get employee list

  constructor(private attendanceService: AttendanceService) { }

  ngOnInit(): void {
    // The empleados$ observable will automatically emit values from Firestore when the component is initialized
  }
}
