import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class UserService {
  private apiUrl = "http://localhost:8080/api/zave/user"; // URL del backend

  constructor(private http: HttpClient) {}

  // Login sin validación de token
  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password });
  }

  // Registro sin validación de seguridad
  register(email: string, password: string, nombre: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, {
      email,
      password,
      nombre,
    });
  }

  // Método para guardar el userId como número en localStorage después de login o registro
  setUserData(userId: number): void {
    localStorage.setItem("userId", userId.toString()); // Guarda como string, pero es un número
  }

  // Método para verificar si el usuario está autenticado
  isAuthenticated(): boolean {
    const userId = localStorage.getItem("userId");
    return userId !== null;
  }

  // Método para obtener el userId como número
  getUserData(): number | null {
    const userId = localStorage.getItem("userId");
    return userId ? Number(userId) : null;
  }

  getUserNameFromBackend(userId: number): Observable<string> {
    return this.http.get(`${this.apiUrl}/username/${userId}`, {
      responseType: "text",
    });
  }
}
