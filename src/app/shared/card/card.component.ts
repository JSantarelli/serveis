import { Component, Input, ViewChild, ElementRef, OnChanges, AfterViewInit, SimpleChanges, EventEmitter, Output } from '@angular/core';
import { LabelComponent } from '../label/label.component';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [LabelComponent, CommonModule, ButtonComponent],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss'
})

export class CardComponent implements OnChanges, AfterViewInit {
  @Input() selected = false;
  @Input() aligned: 'start' | 'end' | 'center' = 'center';
  @Input() selectable = false;
  @Input() align: 'start' | 'end' | 'center' = 'center';
  @Input() size: 'xs' | 'sm' | 'md' | 'lg' | 'block' = 'md';
  @Input() severity: 'info' | 'success' | 'warning' | 'danger' | 'neutral' | 'custom' = 'neutral';
  @Input() variant: 'fill' | 'outline' | 'fab' = 'outline';
  @Input() direction: 'column' | 'row' = 'column';
  @Input() color = '';
  @Input() closable = false;
  @Input() top?: string;
  @Input() right?: string;
  @Input() bottom?: string;
  @Input() left?: string;
  @Output() cardSelected = new EventEmitter<void>(); // Emits when this card is selected


  // Ver de pasar direccionalidad desde la card al label
  @ViewChild('cardColor', { static: true }) cardColor!: ElementRef;
  @ViewChild(LabelComponent, { static: true}) label?: LabelComponent;


  get cssDirection() {
    return this.direction === 'row' ? 'card__wrapper--row' : 'card__wrapper--column';
  }

  ngAfterViewInit(): void {
    if (this.label) {
      this.label.direction = this.direction;
    }
    if (this.severity === 'custom' && this.color) {
      this.applyCustomColor();
    }
  }

  private applyCustomColor(): void {
    this.cardColor.nativeElement.style.setProperty('--card__border--color', this.color);
    this.cardColor.nativeElement.style.setProperty('--card__bg--color', `${this.color}25`);
    
    if (this.label) {
      this.label.severity = this.color;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {

    // Util para comportamietno mobile o sidebar retráctil 
    if (changes['direction'] && this.label) {
      this.label.direction = this.direction;
    }
  }

  closeCard(event: Event) {
    event.stopPropagation();
    this.cardColor.nativeElement.remove();
  }

  onCardClick() {
    if (this.selectable) {
      this.cardSelected.emit(); // Notify parent component
    }
  }

  setFabPositionStyles(): { [key: string]: string | undefined } {
    return this.variant === 'fab'
      ? {
          position: 'absolute',
          top: this.top,
          right: this.right,
          bottom: this.bottom,
          left: this.left,
        }
      : {};
  }
}