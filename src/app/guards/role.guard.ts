// role.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}
  
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    const allowedRoles = route.data['roles'] as Array<string>;
    
    return this.authService.getCurrentUserRole().pipe(
      take(1),
      map(role => {
        if (!role) return false;
        return allowedRoles.includes(role);
      }),
      tap(hasRole => {
        if (!hasRole) {
          console.log('Access denied - Insufficient permissions');
          this.router.navigate(['/dashboard']);
        }
      })
    );
  }
}