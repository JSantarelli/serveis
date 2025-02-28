import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './badge.component.html',
  styleUrls: ['./badge.component.scss']
})
export class BadgeComponent implements OnChanges {
  @Input() severity: 'success' | 'danger' | 'warning' | 'neutral' | 'info' = 'info';
  @Input() size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() label?: string;

  public badgeStyle: { [key: string]: string } = {};
  public badgeIconClass: string = '';

  ngOnChanges(): void {
    this.setBadgeProperties();
  }

  private setBadgeProperties(): void {
    switch (this.severity) {
      case 'success':
        this.badgeStyle = {
          'background-color': 'var(--success--light)',
          'color': 'var(--success--dark)'
        };
        this.badgeIconClass = 'fa-solid fa-circle-check';
        break;
      case 'warning':
        this.badgeStyle = {
          'background-color': 'var(--warning--light)',
          'color': 'var(--warning)'
        };
        this.badgeIconClass = 'fa-solid fa-circle-exclamation';
        break;
      case 'danger':
        this.badgeStyle = {
          'background-color': 'var(--danger--light)',
          'color': 'var(--danger)'
        };
        this.badgeIconClass = 'fa-solid fa-triangle-exclamation';
        break;
      case 'info':
        this.badgeStyle = {
          'background-color': 'var(--info--light)',
          'color': 'var(--info)'
        };
        this.badgeIconClass = 'fa-solid fa-circle-info';
        break;
      case 'neutral':
        this.badgeStyle = {
          'background-color': '#e0e0e0',  // Add a neutral light color in your CSS variables
          'color': '#6c757d'  // Add a neutral color in your CSS variables
        };
        this.badgeIconClass = 'fa-solid fa-circle-question';
        break;
      default:
        break;
    }
  }
}
