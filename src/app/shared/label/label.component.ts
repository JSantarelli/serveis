import { Component, Input, OnChanges, SimpleChanges, ElementRef, Renderer2, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-label',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './label.component.html',
  styleUrls: ['./label.component.scss']
})
export class LabelComponent implements OnChanges{
  @Input() icon?: string;
  @Input() img?: string;
  @Input() iconLabel?: string;
  @Input() severity: 'primary' | 'secondary' | 'tertiary' | 'neutral' | 'custom' | string = 'neutral';
  @Input() color!: string;
  @Input() label?: string | Date;
  @Input() subtitle?: string;
  @Input() prefix?: string;
  @Input() direction: 'row' | 'column' | 'none' = 'column';
  @Input() size: 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full' = 'md';

  @ViewChild('labelColor', { static: true }) labelColor!: ElementRef;

  constructor() {}
  
  ngOnChanges(changes: SimpleChanges) {
    if (changes['severity'], ['color']) {
      this.updateIconColor();
    }
  }

  // Reveer color icono
  private updateIconColor() {
    if (typeof this.severity === 'string') {
      if (['primary', 'secondary', 'tertiary', 'neutral'].includes(this.severity)) {
        this.labelColor.nativeElement.style.setProperty('--label__icon--color', `var(--${this.severity})`);
      } else {
        this.labelColor.nativeElement.style.setProperty('--label__icon--color', this.color);
      }
    }
  }
}
