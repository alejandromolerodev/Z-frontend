import { Component, OnInit } from "@angular/core";
import { CuentaService } from "../services/cuenta.service";
import { UserService } from "../services/user.service";
import { CommonModule } from "@angular/common";
import { Router, RouterLink } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { AuthService } from "../services/auth.service";

@Component({
  selector: "app-gastos",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: "./gastos.component.html",
  styleUrls: ["./gastos.component.css"],
})
export class GastosComponent implements OnInit {
  isMenuCollapsed = true;
  usuarioNombre: string = "";
  cuentas: any[] = [];
  selectedCuenta: any = null;
  gastos: any[] = [];
  ordenFecha: "asc" | "desc" = "desc";

  // Campos para gasto
  nuevoGasto: number = 0;
  gastoCategoria: string = "";
  gastoDescripcion: string = "";
  gastoFecha: string = "";

  constructor(
    private cuentaService: CuentaService,
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const userId = parseInt(localStorage.getItem("userId") || "0", 10);

    if (userId) {
      this.cargarCuentasUsuario(userId);

      this.userService.getUserNameFromBackend(userId).subscribe(
        (username) => {
          this.usuarioNombre = username;
        },
        (error) => {
          console.error("Error al obtener el nombre de usuario", error);
        },
      );
    } else {
      this.router.navigate(["/login"]);
    }
  }

  cargarCuentasUsuario(userId: number): void {
    this.cuentaService.getCuentasUsuario(userId).subscribe(
      (data) => {
        this.cuentas = data;
        if (this.cuentas.length > 0) {
          this.selectedCuenta = this.cuentas[0];
          this.cargarGastos(this.selectedCuenta.id);
        }
      },
      (error) => {
        console.error("Error al obtener las cuentas", error);
      },
    );
  }

  cargarGastos(cuentaId: number): void {
    this.cuentaService.getGastosDeCuenta(cuentaId).subscribe(
      (data) => {
        this.gastos = data;
        this.ordenarPorFecha(this.ordenFecha);
      },
      (error) => {
        console.error("Error al obtener gastos", error);
      },
    );
  }

  onCuentaSeleccionada(cuenta: any): void {
    this.selectedCuenta = cuenta;
    this.cargarGastos(cuenta.id);
  }

  ordenarPorFecha(orden: "asc" | "desc"): void {
    this.ordenFecha = orden;
    this.gastos.sort((a, b) => {
      const fechaA = new Date(a.fecha).getTime();
      const fechaB = new Date(b.fecha).getTime();
      return orden === "asc" ? fechaA - fechaB : fechaB - fechaA;
    });
  }

  agregarGasto(): void {
    if (
      this.selectedCuenta &&
      this.nuevoGasto > 0 &&
      this.gastoCategoria &&
      this.gastoFecha
    ) {
      const gastoData = {
        importe: this.nuevoGasto,
        categoria: this.gastoCategoria,
        descripcion: this.gastoDescripcion,
        fecha: this.gastoFecha,
      };

      this.cuentaService
        .agregarGasto(this.selectedCuenta.id, gastoData)
        .subscribe(
          () => {
            this.cargarGastos(this.selectedCuenta.id);
            // Resetear formulario
            this.nuevoGasto = 0;
            this.gastoCategoria = "";
            this.gastoDescripcion = "";
            this.gastoFecha = "";
          },
          (error) => console.error("Error al agregar gasto", error),
        );
    }
  }

  toggleMenu() {
    this.isMenuCollapsed = !this.isMenuCollapsed;
  }

  cerrarSesion(): void {
    const confirmacion = confirm("¿Estás seguro que quieres cerrar sesión?");
    if (confirmacion) {
      this.authService.logout();
      localStorage.removeItem("userId");
      this.router.navigate(["/login"]);
    }
  }

  mostrarInfoCreador(): void {
    alert(
      "👨‍💻 Nombre: Alejandro Molero Torres\n📅 Fecha de creación: 6 de junio de 2025\n\nGracias por utilizar esta plataforma de gestión financiera.",
    );
  }
}
