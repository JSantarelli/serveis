import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl, FormGroupDirective, Validators } from '@angular/forms';

@Component({
  selector: 'app-required',
  standalone: true,
  templateUrl: './required.component.html',
  styleUrl: './required.component.scss'
})
export class RequiredComponent implements OnInit {
  @Input() label?: string;
  @Input() control?: string;

  isRequired = false;

  constructor(private formGroupDirective: FormGroupDirective) {}

  ngOnInit() {
    if (this.control) {
      const formControl = this.getFormControl(this.control);
      if (formControl) {
        this.isRequired = this.hasRequiredValidator(formControl);
      }
    }
  }

  private getFormControl(controlName: string): AbstractControl | null {
    const formGroup = this.formGroupDirective.form;
    return formGroup.get(controlName);
  }

  private hasRequiredValidator(control: AbstractControl): boolean {
    return control.hasValidator(Validators.required);
  }
}
