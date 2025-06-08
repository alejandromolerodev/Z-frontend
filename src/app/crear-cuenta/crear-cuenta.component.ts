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
  styleUrls: ["./crear-cuenta.component.css"],
})
export class CrearCuentaComponent implements OnInit {
  // Datos para crear una nueva cuenta
  crearCuentaData = {
    nombre: "",
    tipo: "",
    saldo: 0,
  };

  // Datos para editar una cuenta existente
  editarCuentaData = {
    nombre: "",
    tipo: "",
    saldo: 0,
  };

  // Estado del menú (colapsado o no)
  isMenuCollapsed = true;

  // Nombre del usuario que ha iniciado sesión
  usuarioNombre: string = "";

  // Lista de cuentas que ya tiene el usuario
  cuentasExistentes: any[] = [];

  // ID de la cuenta seleccionada para editar
  cuentaSeleccionadaId: number | null = null;

  // Controla si el menú está abierto
  menuOpen = false;

  // Constructor: obtiene el nombre del usuario al iniciar el componente
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

  // Se ejecuta al iniciar el componente y carga las cuentas del usuario
  ngOnInit(): void {
    this.cargarCuentas();
  }

  // Carga las cuentas asociadas al usuario desde el backend
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

  // Maneja la selección de una cuenta para editar sus datos
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

  // Crea una nueva cuenta con los datos ingresados
  crearCuenta(): void {
    const userId = parseInt(localStorage.getItem("userId") || "0", 10);
    if (!userId) {
      alert("Usuario no autenticado");
      this.router.navigate(["/login"]);
      return;
    }

    if (!this.crearCuentaData.tipo || this.crearCuentaData.tipo.trim() === "") {
      alert("El tipo de cuenta es obligatorio y no puede estar vacío.");
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

  // Edita una cuenta existente con los nuevos datos
  editarCuenta(): void {
    if (!this.cuentaSeleccionadaId) return;

    if (
      !this.editarCuentaData.tipo ||
      this.editarCuentaData.tipo.trim() === ""
    ) {
      alert("El tipo de cuenta es obligatorio y no puede estar vacío.");
      return;
    }

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

  // Abre o cierra el menú de navegación
  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  // Cierra sesión del usuario y redirige al login
  cerrarSesion(): void {
    const confirmacion = confirm("¿Estás seguro que quieres cerrar sesión?");
    if (confirmacion) {
      this.authService.logout();
      localStorage.removeItem("userId");
      this.router.navigate(["/login"]);
    }
  }

  // Muestra información sobre el creador de la aplicación
  mostrarInfoCreador(): void {
    alert(
      "👨‍💻 Nombre: Alejandro Molero Torres\n📅 Fecha de creación: 6 de junio de 2025\n\nGracias por utilizar esta plataforma de gestión financiera.\n\nGithub: https://github.com/alejandromolerodev/README.git",
    );
  }

  // Elimina permanentemente la cuenta del usuario actual
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
