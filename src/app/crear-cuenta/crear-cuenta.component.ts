import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { CuentaService } from "../services/cuenta.service";
import { AuthService } from "../services/auth.service";
import { UserService } from "../services/user.service";

@Component({
  selector: "app-crear-cuenta",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: "./crear-cuenta.component.html",
})
export class CrearCuentaComponent implements OnInit {
  crearCuentaData = {
    nombre: "",
    tipo: "",
    saldo: 0,
  };

  editarCuentaData = {
    nombre: "",
    tipo: "",
    saldo: 0,
  };

  isMenuCollapsed = true;
  usuarioNombre: string = "";
  cuentasExistentes: any[] = [];
  cuentaSeleccionadaId: number | null = null;
  menuOpen = false;

  constructor(
    private cuentaService: CuentaService,
    private router: Router,
    private authService: AuthService,
    private userService: UserService,
  ) {
    const userId = parseInt(localStorage.getItem("userId") || "0", 10);
    if (userId) {
      this.userService.getUserNameFromBackend(userId).subscribe({
        next: (username) => (this.usuarioNombre = username),
        error: (err) =>
          console.error("Error al obtener el nombre de usuario", err),
      });
    }
  }

  ngOnInit(): void {
    this.cargarCuentas();
  }

  cargarCuentas(): void {
    const userId = parseInt(localStorage.getItem("userId") || "0", 10);
    if (userId) {
      this.cuentaService.getCuentasUsuario(userId).subscribe({
        next: (cuentas) => {
          this.cuentasExistentes = cuentas;
        },
        error: (err) => {
          console.error("Error al cargar cuentas:", err);
        },
      });
    }
  }

  onSeleccionarCuenta(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const cuentaId = parseInt(selectElement.value, 10);
    this.cuentaSeleccionadaId = cuentaId;

    const cuenta = this.cuentasExistentes.find((c) => c.id === cuentaId);
    if (cuenta) {
      this.editarCuentaData = {
        nombre: cuenta.nombre,
        tipo: cuenta.tipo,
        saldo: cuenta.saldo,
      };
    } else {
      this.editarCuentaData = { nombre: "", tipo: "", saldo: 0 };
    }
  }

  crearCuenta(): void {
    const userId = parseInt(localStorage.getItem("userId") || "0", 10);
    if (!userId) {
      alert("Usuario no autenticado");
      this.router.navigate(["/login"]);
      return;
    }

    this.cuentaService.crearCuenta(userId, this.crearCuentaData).subscribe({
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

  editarCuenta(): void {
    if (!this.cuentaSeleccionadaId) return;

    this.cuentaService
      .editarCuenta(this.cuentaSeleccionadaId, this.editarCuentaData)
      .subscribe({
        next: () => {
          alert("Cuenta actualizada correctamente");
          this.router.navigate(["/resumen"]);
        },
        error: (err) => {
          console.error("Error al editar cuenta", err);
          alert("No se pudo actualizar la cuenta");
        },
      });
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
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
      "👨‍💻 Nombre: Alejandro Molero Torres\n📅 Fecha de creación: 6 de junio de 2025\n\nGracias por utilizar esta plataforma de gestión financiera.\n\nGithub: https://github.com/alejandromolerodev/README.git",
    );
  }

  deleteUser(): void {
    try {
      const userId = parseInt(localStorage.getItem("userId") || "0", 10);

      if (!userId || userId === 0) {
        throw new Error("ID de usuario no válido");
      }

      const confirmacion = confirm(
        "¿Estás seguro que quieres eliminar tu cuenta permanentemente?\nEsta acción no se puede deshacer.",
      );

      if (confirmacion) {
        this.userService.deleteUser(userId).subscribe({
          next: () => {
            this.authService.logout();
            localStorage.clear();
            this.router.navigate(["/login"]);
          },
          error: (err) => {
            console.error("Error al eliminar la cuenta:", err);
            alert(
              `Error al eliminar la cuenta: ${err.message || "Error desconocido"}`,
            );
          },
        });
      }
    } catch (error) {
      console.error("Error en deleteUser:", error);
      alert("Ocurrió un error al procesar la solicitud");
    }
  }
}
