import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CardComponent } from '../card/card.component';
import { LabelComponent } from '../label/label.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    LabelComponent,
    CardComponent,
    CommonModule
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})

export class NavbarComponent {

  @Input() items: any[] = [];
  @Output() categorySelected = new EventEmitter<string>();

  toggleSelectable(item: any) {
    item.selectable = !item.selectable;
    if (item.selectable) {
      this.categorySelected.emit(item.label);
    } else {
      this.categorySelected.emit(''); // Reset filter
    }
  }

  trackByFn(index: number, item: any): string {
    return item.label;
  }
}
