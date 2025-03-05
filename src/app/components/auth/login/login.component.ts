import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService, Credential } from './../../../services/auth.service';
import { LabelComponent } from './../../../shared/label/label.component';
import { ButtonComponent } from './../../../shared/button/button.component';
import { RequiredComponent } from './../../../shared/required/required.component';
import { CardComponent } from './../../../shared/card/card.component';

interface LoginForm {
  nombre: FormControl<string | null>;
  apellido: FormControl<string | null>;
  email: FormControl<string>;
  password: FormControl<string>;
  rol: FormControl<string>;
}

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterModule,
    LabelComponent,
    ButtonComponent,
    RequiredComponent,
    CardComponent,
    CommonModule
  ],
  selector: 'app-login',
  templateUrl: './login.component.html',
})

export class LoginComponent {
  // rolMap: { [key: string]: { icon: string; color: string } } = {
  //   'Empleado': { icon: 'user-md', color: '#007bff' },
  //   'Administrador': { icon: 'user', color: '#28a745' }
  // }; 
  
  hide = true;
  successMessage = '';
  errorMessage = '';

  formBuilder = inject(FormBuilder);

  private authService = inject(AuthService);
  private router = inject(Router);

  form: FormGroup<LoginForm> = this.formBuilder.group({
    nombre: this.formBuilder.control(''),
    apellido: this.formBuilder.control(''),
    email: this.formBuilder.control('', {
      validators: [Validators.required, Validators.email],
      nonNullable: true,
    }),
    password: this.formBuilder.control('', {
      validators: Validators.required,
      nonNullable: true,
    }),
    rol: this.formBuilder.control('', {nonNullable: true})
  });

  get isEmailValid(): string | boolean {
    const control = this.form.get('email');
    const isInvalid = control?.invalid && control.touched;

    if (isInvalid) {
      return control.hasError('required')
        ? 'Este campo es requerido'
        : 'Ingrese un mail válido';
    }

    return false;
  }

  async logIn(): Promise<void> {
    if (this.form.invalid) return;

    const credential: Credential = {
      name: this.form.value.email || '',
      lastName: this.form.value.email || '',
      email: this.form.value.email || '',
      password: this.form.value.password || '',
      rol: this.form.value.rol || '',
    };

    try {
      await this.authService.logInWithEmailAndPassword(credential);
      this.successMessage = 'Usuario autenticado, redirigiendo...';
      this.errorMessage = '';
      this.router.navigateByUrl('/');
    } catch (error) {
      this.successMessage = '';
      this.errorMessage = 'Las credenciales ingresadas no son correctas';    }
  }

  openSnackBar() {
    return alert('Succesfully Log in')
  }
}
