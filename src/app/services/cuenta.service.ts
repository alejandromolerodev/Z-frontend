import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: "root",
})
export class CuentaService {
  private apiUrl = environment.apiUrl + "/api/zave/cuenta";

  constructor(private http: HttpClient) {}

  // Obtener todas las cuentas de un usuario
  getCuentasUsuario(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/cuentas/${userId}`);
  }

  // Obtener los ingresos de una cuenta específica
  getIngresosDeCuenta(cuentaId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/ingresos/${cuentaId}`);
  }

  // Obtener los gastos de una cuenta específica
  getGastosDeCuenta(cuentaId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/gastos/${cuentaId}`);
  }

  getSaldoDeCuenta(cuentaId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/saldo/${cuentaId}`);
  }

  // Agregar un nuevo ingreso
  agregarIngreso(
    cuentaId: number,
    ingreso: {
      importe: number;
      categoria: string;
      descripcion: string;
      fecha: string;
    },
  ): Observable<any> {
    return this.http.post(`${this.apiUrl}/ingresos/${cuentaId}`, ingreso);
  }

  // Agregar un nuevo gasto
  agregarGasto(
    cuentaId: number,
    gasto: {
      importe: number;
      categoria: string;
      descripcion: string;
      fecha: string;
    },
  ): Observable<any> {
    return this.http.post(`${this.apiUrl}/gastos/${cuentaId}`, gasto);
  }

  // Crear una nueva cuenta asociada a un usuario
  crearCuenta(userId: number, cuentaData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/usuario/${userId}`, cuentaData);
  }

  // Eliminar cuenta
  eliminarCuenta(cuentaId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${cuentaId}`);
  }

  // editar cuenta
  editarCuenta(cuentaId: number, datos: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/cuenta/${cuentaId}`, datos);
  }
}
