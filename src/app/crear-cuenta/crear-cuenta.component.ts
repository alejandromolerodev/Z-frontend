import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { CuentaService } from "../services/cuenta.service";

@Component({
  selector: "app-crear-cuenta",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./crear-cuenta.component.html",
})
export class CrearCuentaComponent {
  nombre: string = "";
  tipo: string = "";
  saldo: number = 0;

  constructor(
    private cuentaService: CuentaService,
    private router: Router,
  ) {}

  crearCuenta(): void {
    const userId = parseInt(localStorage.getItem("userId") || "0", 10);
    console.log(userId);
    if (!userId) {
      alert("Usuario no autenticado");
      this.router.navigate(["/login"]);
      return;
    }

    const cuenta = {
      nombre: this.nombre,
      tipo: this.tipo,
      saldo: this.saldo,
    };

    this.cuentaService.crearCuenta(userId, cuenta).subscribe({
      next: () => {
        alert("Cuenta creada exitosamente");
        this.router.navigate(["/resumen"]);
      },
      error: (err) => {
        console.error("Error al crear cuenta", err);
        alert("Hubo un error al crear la cuenta");
      },
    });
  }
}
