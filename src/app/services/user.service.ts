import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: "root",
})
export class UserService {
  private apiUrl = environment.apiUrl + "/api/zave/user"; // Base URL backend

  constructor(private http: HttpClient) {}

  /**
   * Realiza login enviando email y password al backend
   * @param email string
   * @param password string
   * @returns Observable con la respuesta del servidor
   */
  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password });
  }

  /**
   * Registra un nuevo usuario con email, password y nombre
   * @param email string
   * @param password string
   * @param nombre string
   * @returns Observable con la respuesta del servidor
   */
  register(email: string, password: string, nombre: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, {
      email,
      password,
      nombre,
    });
  }

  /**
   * Guarda el ID del usuario en localStorage
   * @param userId number
   */
  setUserData(userId: number): void {
    localStorage.setItem("userId", userId.toString());
  }

  /**
   * Verifica si hay un usuario autenticado
   * @returns boolean
   */
  isAuthenticated(): boolean {
    return localStorage.getItem("userId") !== null;
  }

  /**
   * Obtiene el ID del usuario desde localStorage como número
   * @returns number | null
   */
  getUserData(): number | null {
    const userId = localStorage.getItem("userId");
    return userId ? Number(userId) : null;
  }

  /**
   * Consulta el nombre del usuario desde backend según su ID
   * @param userId number
   * @returns Observable<string> con el nombre del usuario
   */
  getUserNameFromBackend(userId: number): Observable<string> {
    return this.http.get(`${this.apiUrl}/username/${userId}`, {
      responseType: "text",
    });
  }

  /**
   * Elimina un usuario de backend según su ID
   * @param userId number
   * @returns Observable con la respuesta del servidor
   */
  deleteUser(userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/id/${userId}`);
  }
}
