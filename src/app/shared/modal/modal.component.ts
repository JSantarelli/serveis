import { Component, Input, Output, EventEmitter } from '@angular/core';
import { LabelComponent } from '../label/label.component';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'],
  standalone: true,
  imports: [
    LabelComponent,
    ButtonComponent
  ],
})
export class ModalComponent {
  @Input() img?: string;
  @Input() caption?: string;
  @Input() prefix?: string;
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() icon?: string;
  @Input() size: 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full' = 'md';
  @Input() closeable?: boolean;
  @Output() closeModal = new EventEmitter<void>();
  @Output() confirmAction = new EventEmitter<void>();

  close() {
    this.closeModal.emit();
  }

  confirm() {
    this.confirmAction.emit();
    this.close();
  }
}
