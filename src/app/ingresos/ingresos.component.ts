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
  selector: "app-ingresos",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: "./ingresos.component.html",
  styleUrls: ["./ingresos.component.css"],
})
export class IngresosComponent implements OnInit {
  isMenuCollapsed = true;
  usuarioNombre: string = "";
  cuentas: any[] = [];
  selectedCuenta: any = null;
  ingresos: any[] = [];
  ordenFecha: "asc" | "desc" = "desc";
  menuOpen = false;

  // Campos para ingreso
  nuevoIngreso: number = 0;
  ingresoCategoria: string = "";
  ingresoDescripcion: string = "";
  ingresoFecha: string = "";

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
          this.cargarIngresos(this.selectedCuenta.id);
        }
      },
      (error) => {
        console.error("Error al obtener las cuentas", error);
      },
    );
  }

  cargarIngresos(cuentaId: number): void {
    this.cuentaService.getIngresosDeCuenta(cuentaId).subscribe(
      (data) => {
        this.ingresos = data;
        this.ordenarPorFecha(this.ordenFecha);
      },
      (error) => {
        console.error("Error al obtener ingresos", error);
      },
    );
  }

  onCuentaSeleccionada(cuenta: any): void {
    this.selectedCuenta = cuenta;
    this.cargarIngresos(cuenta.id);
  }

  ordenarPorFecha(orden: "asc" | "desc"): void {
    this.ordenFecha = orden;
    this.ingresos.sort((a, b) => {
      const fechaA = new Date(a.fecha).getTime();
      const fechaB = new Date(b.fecha).getTime();
      return orden === "asc" ? fechaA - fechaB : fechaB - fechaA;
    });
  }

  agregarIngreso(): void {
    if (
      this.selectedCuenta &&
      this.nuevoIngreso > 0 &&
      this.ingresoCategoria &&
      this.ingresoFecha
    ) {
      const ingresoData = {
        importe: this.nuevoIngreso,
        categoria: this.ingresoCategoria,
        descripcion: this.ingresoDescripcion,
        fecha: this.ingresoFecha,
      };

      this.cuentaService
        .agregarIngreso(this.selectedCuenta.id, ingresoData)
        .subscribe(
          () => {
            this.cargarIngresos(this.selectedCuenta.id);
            // Resetear formulario
            this.nuevoIngreso = 0;
            this.ingresoCategoria = "";
            this.ingresoDescripcion = "";
            this.ingresoFecha = "";
          },
          (error) => console.error("Error al agregar ingreso", error),
        );
    }
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

  async generarPDF(): Promise<void> {
    if (!this.selectedCuenta) return;

    const cuenta = this.selectedCuenta;
    const ingresos = this.ingresos;

    const doc = new jsPDF();

    // Cargar logo
    const logoImg = new Image();
    logoImg.src = "assets/zave.png";
    await new Promise((resolve) => (logoImg.onload = () => resolve(true)));

    // Generar QR
    const qrData = `Cuenta: ${cuenta.nombre}\nTipo: ${cuenta.tipo}\nSaldo: ${cuenta.saldo.toFixed(2)}€`;
    const qrUrl = await QRCode.toDataURL(qrData);

    // === ENCABEZADO ===

    doc.addImage(logoImg, "PNG", 15, 10, 35, 35);
    doc.addImage(qrUrl, "PNG", 15, 50, 35, 35);

    const tituloX = 60;
    const tituloY = 65;
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("Registro de Ingresos", tituloX, tituloY);
    const textWidth = doc.getTextWidth("Registro de Ingresos");
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(tituloX, tituloY + 2, tituloX + textWidth, tituloY + 2);

    // === TABLA DE INGRESOS ===

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

    ingresos.forEach((ingreso, index) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      doc.text(`${index + 1}`, 18, y);
      doc.text(`${ingreso.categoria}`, 30, y);
      doc.text(`${ingreso.importe.toFixed(2)}`, 90, y);
      doc.text(new Date(ingreso.fecha).toLocaleDateString(), 125, y);

      const descripcion = ingreso.descripcion || "-";
      doc.text(
        descripcion.length > 20
          ? descripcion.slice(0, 20) + "..."
          : descripcion,
        155,
        y,
      );

      totalImporte += ingreso.importe;
      y += 8;
    });

    // === TOTAL ===
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Total:   ", 125, y + 10);
    doc.text(`${totalImporte.toFixed(2)} €`, 180, y + 10, { align: "right" });

    doc.save(`ingresos_${cuenta.nombre}.pdf`);
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
            localStorage.clear(); // Limpia todo el localStorage por seguridad
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
