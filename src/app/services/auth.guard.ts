import { Injectable } from "@angular/core";
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from "@angular/router";
import { AuthService } from "../services/auth.service"; // Servicio que gestiona la autenticación del usuario

@Injectable({
  providedIn: "root", // Hace que el guard esté disponible en toda la app sin necesidad de declararlo en un módulo
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService, // Servicio de autenticación
    private router: Router, // Servicio de navegación para redirecciones
  ) {}

  // Este método decide si se permite o no acceder a una ruta protegida
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): boolean {
    if (this.authService.isAuthenticated()) {
      // Si el usuario está autenticado, permite el acceso
      return true;
    } else {
      // Si no está autenticado, lo redirige al login
      this.router.navigate(["/login"]);
      return false;
    }
  }
}
