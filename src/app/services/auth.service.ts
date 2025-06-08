import { Injectable } from "@angular/core";
import { Router } from "@angular/router";

@Injectable({
  providedIn: "root", // Provee el servicio en toda la app
})
export class AuthService {
  constructor(private router: Router) {}

  /**
   * Verifica si el usuario está autenticado
   * Comprueba si existe 'userId' en localStorage
   * @returns boolean
   */
  isAuthenticated(): boolean {
    const userId = localStorage.getItem("userId");
    return userId !== null;
  }

  /**
   * Guarda el ID del usuario en localStorage para mantener la sesión
   * @param userId - ID numérico del usuario
   */
  setUserData(userId: number): void {
    localStorage.setItem("userId", userId.toString());
  }

  /**
   * Cierra sesión eliminando los datos y redirigiendo al login
   */
  logout(): void {
    localStorage.removeItem("userId");
    this.router.navigate(["/login"]);
  }
}
