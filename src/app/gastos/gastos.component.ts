import { Component, OnInit } from "@angular/core";
import { CuentaService } from "../services/cuenta.service";
import { UserService } from "../services/user.service";
import { CommonModule } from "@angular/common";
import { Router, RouterLink } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { AuthService } from "../services/auth.service";
import jsPDF from "jspdf";
import QRCode from "qrcode";

@Component({
  selector: "app-gastos",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: "./gastos.component.html",
  styleUrls: ["./gastos.component.css"],
})
export class GastosComponent implements OnInit {
  // Estado del menú
  isMenuCollapsed = true;
  menuOpen = false;

  // Usuario y cuentas
  usuarioNombre: string = "";
  cuentas: any[] = [];
  selectedCuenta: any = null;

  // Lista de gastos y orden
  gastos: any[] = [];
  ordenFecha: "asc" | "desc" = "desc";

  // Formulario de nuevo gasto
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

  // Se ejecuta al iniciar el componente
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

  // Carga las cuentas del usuario
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

  // Carga los gastos de una cuenta
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

  // Cambia la cuenta seleccionada
  onCuentaSeleccionada(cuenta: any): void {
    this.selectedCuenta = cuenta;
    this.cargarGastos(cuenta.id);
  }

  // Ordena los gastos por fecha
  ordenarPorFecha(orden: "asc" | "desc"): void {
    this.ordenFecha = orden;
    this.gastos.sort((a, b) => {
      const fechaA = new Date(a.fecha).getTime();
      const fechaB = new Date(b.fecha).getTime();
      return orden === "asc" ? fechaA - fechaB : fechaB - fechaA;
    });
  }

  // Agrega un nuevo gasto a la cuenta
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
            // Limpia el formulario
            this.nuevoGasto = 0;
            this.gastoCategoria = "";
            this.gastoDescripcion = "";
            this.gastoFecha = "";
          },
          (error) => console.error("Error al agregar gasto", error),
        );
    }
  }

  // Muestra u oculta el menú
  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  // Cierra la sesión del usuario
  cerrarSesion(): void {
    const confirmacion = confirm("¿Estás seguro que quieres cerrar sesión?");
    if (confirmacion) {
      this.authService.logout();
      localStorage.removeItem("userId");
      this.router.navigate(["/login"]);
    }
  }

  // Muestra información del desarrollador
  mostrarInfoCreador(): void {
    alert(
      "👨‍💻 Nombre: Alejandro Molero Torres\n📅 Fecha de creación: 6 de junio de 2025\n\nGracias por utilizar esta plataforma de gestión financiera.\n\nGithub: https://github.com/alejandromolerodev/README.git",
    );
  }

  // Genera un PDF con la información de los gastos
  async generarPDF(): Promise<void> {
    if (!this.selectedCuenta) return;

    const cuenta = this.selectedCuenta;
    const gastos = this.gastos;

    const doc = new jsPDF();

    // Carga el logo
    const logoImg = new Image();
    logoImg.src = "assets/zave.png";
    await new Promise((resolve) => (logoImg.onload = () => resolve(true)));

    // Genera un código QR con los datos de la cuenta
    const qrData = `Cuenta: ${cuenta.nombre}\nTipo: ${cuenta.tipo}\nSaldo: ${cuenta.saldo.toFixed(2)}€`;
    const qrUrl = await QRCode.toDataURL(qrData);

    // === Encabezado del PDF ===
    doc.addImage(logoImg, "PNG", 15, 10, 35, 35);
    doc.addImage(qrUrl, "PNG", 15, 50, 35, 35);

    const tituloX = 60;
    const tituloY = 65;
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("Registro de Gastos", tituloX, tituloY);
    const textWidth = doc.getTextWidth("Registro de Gastos");
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(tituloX, tituloY + 2, tituloX + textWidth, tituloY + 2);

    // === Tabla de gastos ===
    let y = 95;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setFillColor(230, 230, 250);
    doc.rect(15, y, 180, 10, "F");
    doc.setTextColor(0);
    doc.text("Nº", 18, y + 7);
    doc.text("Categoría", 30, y + 7);
    doc.text("Importe (€)", 90, y + 7);
    doc.text("Fecha", 125, y + 7);
    doc.text("Descripción", 155, y + 7);

    y += 12;
    doc.setFont("helvetica", "normal");

    let totalImporte = 0;

    // Rellena las filas con los gastos
    gastos.forEach((gasto, index) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      doc.text(`${index + 1}`, 18, y);
      doc.text(`${gasto.categoria}`, 30, y);
      doc.text(`${gasto.importe.toFixed(2)}`, 90, y);
      doc.text(new Date(gasto.fecha).toLocaleDateString(), 125, y);

      const descripcion = gasto.descripcion || "-";
      doc.text(
        descripcion.length > 20
          ? descripcion.slice(0, 20) + "..."
          : descripcion,
        155,
        y,
      );

      totalImporte += gasto.importe;
      y += 8;
    });

    // === Total del PDF ===
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Total:   ", 125, y + 10);
    doc.text(`${totalImporte.toFixed(2)} €`, 180, y + 10, { align: "right" });

    // Guarda el archivo PDF
    doc.save(`gastos_${cuenta.nombre}.pdf`);
  }

  // Elimina la cuenta del usuario permanentemente
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
            localStorage.clear(); // Limpia el almacenamiento
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
