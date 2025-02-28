import { Component, Input } from '@angular/core';

@Component({
    selector: 'plex-icon',
    template: `<i class="{{prefix}} {{prefix}}-{{name}} {{cssType}} {{ cssSize }}"></i> `,
})
export class PlexIconComponent {
    @Input() prefix = 'adi';
    @Input() name?: string;
    @Input() type?: PlexType;
    // Usar números con mdi, valores string con otro prefix
    @Input() size: '18' | '24' | '36' | '48' | PlexSize = 'sm';

    constructor() { }

    get cssSize(): string {
        return `${this.prefix === 'mdi' ? `${this.prefix}-${this.size}px` : this.size}`;
    }

    get cssType(): string {
        return this.type ? 'ii-' + this.type : '';
    }

}


// import { PlexSize } from './../core/plex-size.type';
export type PlexSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'block';



// import { PlexType } from './../core/plex-type.type';
export type PlexType = 'default' | 'info' | 'success' | 'warning' | 'danger' | 'light' | 'dark';