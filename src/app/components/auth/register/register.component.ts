import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  ValidatorFn,
  ValidationErrors,
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AttendanceService } from './../../../services/attendance.service';
import { AuthService, Credential } from './../../../services/auth.service';
import { ButtonComponent } from './../../../shared/button/button.component';
import { LabelComponent } from './../../../shared/label/label.component';
import { RequiredComponent } from './../../../shared/required/required.component';
import { CardComponent } from './../../../shared/card/card.component';

interface SignUpForm {
  nombre: FormControl<string>;
  apellido: FormControl<string>;
  email: FormControl<string>;
  password: FormControl<string>;
  confirmPassword: FormControl<string>;
}

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterModule,
    ButtonComponent,
    LabelComponent,
    RequiredComponent,
    CardComponent,
    CommonModule
  ],
  selector: 'app-register',
  templateUrl: './register.component.html',
  providers: [],
})
export class RegisterComponent {
  hide = true;
  isMobile = false;
  direction = 'column';
  showConfirmMsg = false;
  showErrorMsg = false;
  confirmPassword = '';
  passHasChange = false;
  passwordHelpText = `
  Por favor, asegúrate de que tu contraseña cumpla con los siguientes requisitos:
  Longitud Mínima: La contraseña debe tener al menos 8 caracteres.
  Incluye un Número: Debe contener al menos un número (0-9).
  Mayúsculas: Debe incluir al menos una letra mayúscula (A-Z).
  Símbolos Especiales: Debe tener al menos un símbolo especial, como: ! @ # $ % ^ & * ( ) , . ? " : { } | < >.
`;

  private router = inject(Router);
  private empleadoId = '';

  get _empleadoId(): string {
    return this.empleadoId;
  }

  formBuilder = inject(FormBuilder).nonNullable;
  authService = inject(AuthService);
  empleadoService = inject(AttendanceService);

  form = this.formBuilder.group<SignUpForm>({
    nombre: this.formBuilder.control('', Validators.required),
    apellido: this.formBuilder.control('', Validators.required),
    email: this.formBuilder.control('', Validators.email),
    password: this.formBuilder.control('', Validators.required),
    confirmPassword: this.formBuilder.control('', {
     validators: [Validators.required,
      this.passwordFormatValidator()]
    }),
  });

  ngOnInit(): void {
    this.checkIfMobile(window.innerWidth);
  }

  checkIfMobile(width: number): void {
    this.isMobile = width < 768; 
  }

  // Custom Validator for password format (must contain at least one number)
  passwordFormatValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const valid = /\d/.test(control.value);
      const uppercase = /[A-Z]/.test(control.value);
      const symbol = /[!@#$%^&*(),.?":{}|<>]/.test(control.value);
      const length = control.value?.length >= 8;
      // const combined = /\d/.test(control.value) && /[A-Z]/.test(control.value) && control.value?.length >= 8;

      return valid && uppercase && symbol && length ? null : { invalidPasswordFormat: true };
    };
  }

  async signUp(): Promise<void> {
    if (this.form.invalid || this.passwordsDoNotMatch) {
      this.showErrorMsg = true;
      return;
    }
    
    const credential: Credential = {
      name: this.form.value.nombre || '',
      lastName: this.form.value.apellido || '',
      email: this.form.value.email || '',
      password: this.form.value.password || '',
    };
    
    try {
      await this.authService.signUpWithEmailAndPassword(credential);
      this.showConfirmMsg = true;
  
      setTimeout(() => {
        this.router.navigateByUrl('/ingresar');
      }, 1500);
      
    } catch (error) {
      console.error(error);
      this.showErrorMsg = true;
    }
  }
  
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

  get passwordsDoNotMatch(): boolean {
    return this.form.controls['password'].value !== this.form.controls['confirmPassword'].value;
  }

}
