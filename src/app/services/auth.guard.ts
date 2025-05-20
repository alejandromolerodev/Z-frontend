import { Injectable } from "@angular/core";
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from "@angular/router";
import { AuthService } from "../services/auth.service"; // Asegúrate de tener el servicio importado

@Injectable({
  providedIn: "root",
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService, // Corrige a `authService`
    private router: Router,
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): boolean {
    if (this.authService.isAuthenticated()) {
      // Corrige a `authService`
      return true; // Permite el acceso a la ruta
    } else {
      this.router.navigate(["/login"]); // Redirige a la página de login si no está autenticado
      return false; // No permite el acceso a la ruta
    }
  }
}
