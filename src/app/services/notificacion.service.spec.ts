import { TestBed } from '@angular/core/testing';
import { NotificationService } from './notificacion.service';

describe('NotificacionService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
