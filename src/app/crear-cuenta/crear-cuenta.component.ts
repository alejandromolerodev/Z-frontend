import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { CuentaService } from "../services/cuenta.service";
import { AuthService } from "../services/auth.service"; // Necesario para logout
import { UserService } from "../services/user.service"; // Necesario para deleteUser

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
  isMenuCollapsed = true; // Para el menú hamburguesa
  usuarioNombre: string = ""; // Para mostrar el nombre en el navbar

  constructor(
    private cuentaService: CuentaService,
    private router: Router,
    private authService: AuthService, // Inyectar AuthService
    private userService: UserService, // Inyectar UserService
  ) {
    // Obtener nombre de usuario al inicializar
    const userId = parseInt(localStorage.getItem("userId") || "0", 10);
    if (userId) {
      this.userService.getUserNameFromBackend(userId).subscribe(
        (username) => {
          this.usuarioNombre = username;
        },
        (error) => {
          console.error("Error al obtener el nombre de usuario", error);
        },
      );
    }
  }

  // Método para crear cuenta (ya lo tienes)
  crearCuenta(): void {
    const userId = parseInt(localStorage.getItem("userId") || "0", 10);
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

  // Métodos para el navbar:
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
