import { Injectable } from "@angular/core";
import { Router } from "@angular/router"; // Importa Router

@Injectable({
  providedIn: "root",
})
export class AuthService {
  constructor(private router: Router) {} // Inyecta Router

  // Método para verificar si el usuario está autenticado (basado en el almacenamiento local)
  isAuthenticated(): boolean {
    const userId = localStorage.getItem("userId");
    return userId !== null; // Si el userId está en el localStorage, el usuario está autenticado
  }

  // Métodos para guardar y borrar los datos de usuario en el localStorage
  setUserData(userId: number): void {
    localStorage.setItem("userId", userId.toString());
  }

  logout(): void {
    localStorage.removeItem("userId");
    this.router.navigate(["/login"]); // Redirige al login
  }
}
