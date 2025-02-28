import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-switcher',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './switcher.component.html',
  styleUrl: './switcher.component.scss'
})
export class SwitcherComponent {
  @Input() on!: boolean;
  @Input() size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() onLabel: string = 'On';
  @Input() offLabel: string = 'Off';
  @Input() colorOn: string = 'green';
  @Input() colorOff: string = 'gray';
  @Input() disabled: boolean = false;
  @Input() labelPosition: 'left' | 'right' = 'right';

  @Output() toggle = new EventEmitter<boolean>();

  onToggle() {
    if (this.disabled) return;
    this.on = !this.on;
    this.toggle.emit(this.on);
  }
}
