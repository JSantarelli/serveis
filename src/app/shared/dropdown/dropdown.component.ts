import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../button/button.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [
    CommonModule, 
    ButtonComponent
  ],
  templateUrl: './dropdown.component.html',
  styleUrl: './dropdown.component.scss'
})
export class DropdownComponent {
  @Input() items: { label: string, icon?: string, subItems?: any[], path?: string, disabled: boolean, callback?: () => void }[] = [];
  @Input() position?: { top: string, left: string };
  @Input() buttonLabel?: string;
  @Input() buttonIcon?: string;
  // Split button
  @Input() buttonVariant: 'fill' | 'outline' | 'link' = 'link';
  @Input() buttonSeverity: 'success' | 'danger' | 'warning' | 'neutral' | 'info' | 'primary' | 'secondary' | 'tertiary' = 'info';
  @Input() buttonDirection: 'row' | 'column' | 'none' = 'none';
  @Input() buttonSize: 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'sm';

  @Output() itemSelected = new EventEmitter<any>();

  constructor(private router: Router) {}
  
  isOpen = false;
  hasNestedItems = false;
  
  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown-container') && this.isOpen) {
      this.close();
    }
  }
  
  toggle(event: Event): void {
    this.isOpen = !this.isOpen;
    this.hasNestedItems = this.items.some(item => item.subItems && item.subItems.length > 0);
    event.stopPropagation(); 
  }
  
  onItemClicked(item: any) {
    this.itemSelected.emit(item);
    if (item.callback) {
      item.callback();
    }
    this.close();
  }
  
  handleNestedItemClick(item: any) {
    this.itemSelected.emit(item);
    this.close();
  }
  
  close() {
    this.isOpen = false;
  }
}
