import { Component, OnInit } from "@angular/core";
import { CuentaService } from "../../../services/cuenta.service";
import { UserService } from "../../../services/user.service";
import { CommonModule } from "@angular/common";
import { Router, RouterLink } from "@angular/router";
import Chart from "chart.js/auto";
import { FormsModule } from "@angular/forms";
import { AuthService } from "../../../services/auth.service";
import { forkJoin } from "rxjs";

@Component({
  selector: "app-resumen",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: "./resumen.component.html",
  styleUrls: ["./resumen.component.css"],
})
export class ResumenComponent implements OnInit {
  isMenuCollapsed = true;
  usuarioNombre: string = "";
  ingresosTotales: number = 0;
  saldo: number = 0;
  gastosTotales: number = 0;
  ahorroMensual: number = 0;
  porcentajeAhorro: number = 0;
  alertas: string[] = [];
  tipoGrafica: "doughnut" | "bar" = "doughnut";
  showUserDropdown = false;

  cuentas: any[] = [];
  selectedCuenta: any = null;
  chart: any = null;

  // Nuevo ingreso y gasto como objetos
  nuevoIngreso = {
    importe: 0,
    categoria: "",
    descripcion: "",
    fecha: "",
  };

  nuevoGasto = {
    importe: 0,
    categoria: "",
    descripcion: "",
    fecha: "",
  };

  mostrarFormularioIngreso: boolean = false;
  mostrarFormularioGasto: boolean = false;

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
          this.cargarIngresosYGastos(this.selectedCuenta.id);
        }
      },
      (error) => {
        console.error("Error al obtener las cuentas", error);
      },
    );
  }

  cargarIngresosYGastos(cuentaId: number): void {
    forkJoin({
      ingresos: this.cuentaService.getIngresosDeCuenta(cuentaId),
      gastos: this.cuentaService.getGastosDeCuenta(cuentaId),
      saldo: this.cuentaService.getSaldoDeCuenta(cuentaId),
    }).subscribe(
      ({ ingresos, gastos, saldo }) => {
        this.ingresosTotales = ingresos.reduce(
          (sum: number, ingreso: any) => sum + ingreso.importe,
          0,
        );
        this.gastosTotales = gastos.reduce(
          (sum: number, gasto: any) => sum + gasto.importe,
          0,
        );
        this.saldo = saldo;
        this.ahorroMensual = this.ingresosTotales - this.gastosTotales;
        this.porcentajeAhorro =
          this.ingresosTotales > 0
            ? (this.ahorroMensual / this.ingresosTotales) * 100
            : 0;

        this.actualizarAlertas();

        this.dibujarGrafica();
      },
      (error) => {
        console.error("Error al obtener ingresos o gastos", error);
      },
    );
  }

  actualizarAlertas(): void {
    this.alertas = [];

    // Alerta 1: Porcentaje de ahorro bajo
    if (this.porcentajeAhorro < 20) {
      this.alertas.push(
        "Cuidado, tu porcentaje de ahorro está por debajo del 20% recomendado.",
      );
    }

    // Alerta 2: Gasto excesivo al agregar nuevo gasto (usamos nuevoGasto.importe)
    if (this.nuevoGasto.importe > this.ingresosTotales * 0.3) {
      this.alertas.push(
        "Atención: Este gasto supera el 30% de tus ingresos totales y puede afectar tu presupuesto.",
      );
    }

    // Alerta 3: Cuenta vacía
    if (this.saldo === 0) {
      this.alertas.push(
        "Tu cuenta está vacía. Considera añadir ingresos para mantener un balance saludable.",
      );
    }

    // Alerta 4: Saldo bajo (menos del 10% de ingresos)
    if (this.saldo > 0 && this.saldo < this.ingresosTotales * 0.1) {
      this.alertas.push(
        "Tu saldo es menor al 10% de tus ingresos totales. Ten cuidado con tus gastos.",
      );
    }

    // Alerta 5: Gastos muy altos respecto a ingresos (>90%)
    if (
      this.ingresosTotales > 0 &&
      this.gastosTotales / this.ingresosTotales > 0.9
    ) {
      this.alertas.push(
        "Tus gastos están muy cerca de tus ingresos totales. Intenta reducirlos para aumentar tu ahorro.",
      );
    }

    // Alerta 6: Ahorro mensual negativo
    if (this.ahorroMensual < 0) {
      this.alertas.push(
        "Estás gastando más de lo que ingresas. Esto puede afectar tu salud financiera.",
      );
    }

    // Alerta 7: Nuevo gasto muy grande respecto al saldo actual (>50%)
    if (this.nuevoGasto.importe > this.saldo * 0.5) {
      this.alertas.push(
        "El gasto que quieres agregar es mayor al 50% del saldo actual. Piensa si es necesario.",
      );
    }
  }

  dibujarGrafica(): void {
    const ctx = document.getElementById("graficaResumen") as HTMLCanvasElement;
    if (this.chart) {
      this.chart.destroy();
    }

    const colores = ["#FF9800", "#4CAF50", "#F44336", "#2196F3"];
    const labels = ["Saldo", "Ingresos", "Gastos", "Ahorro"];
    const datos = [
      this.saldo,
      this.ingresosTotales,
      this.gastosTotales,
      this.ahorroMensual,
    ];
    const isBarChart = this.tipoGrafica === "bar";

    this.chart = new Chart(ctx, {
      type: this.tipoGrafica,
      data: {
        labels: isBarChart ? [""] : labels,
        datasets: isBarChart
          ? labels.map((label, i) => ({
              label,
              data: [datos[i]],
              backgroundColor: colores[i],
              borderColor: colores[i],
              borderWidth: 1,
            }))
          : [
              {
                label: "Resumen Financiero",
                data: datos,
                backgroundColor: colores,
                borderColor: colores,
                borderWidth: 1,
              },
            ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: isBarChart
          ? {
              y: {
                beginAtZero: true,
              },
            }
          : {},
      },
    });
  }

  cambiarTipoGrafica(): void {
    this.tipoGrafica = this.tipoGrafica === "doughnut" ? "bar" : "doughnut";
    this.dibujarGrafica();
  }

  onCuentaSeleccionada(cuenta: any): void {
    this.selectedCuenta = cuenta;
    this.cargarIngresosYGastos(cuenta.id);
  }

  toggleFormularioIngreso(): void {
    this.mostrarFormularioIngreso = !this.mostrarFormularioIngreso;
  }

  toggleFormularioGasto(): void {
    this.mostrarFormularioGasto = !this.mostrarFormularioGasto;
  }

  actualizarSaldo(cuentaId: number): void {
    this.cuentaService.getSaldoDeCuenta(cuentaId).subscribe(
      (nuevoSaldo) => {
        this.saldo = nuevoSaldo;
        if (this.selectedCuenta) {
          this.selectedCuenta.saldo = nuevoSaldo;
        }
        this.dibujarGrafica();
      },
      (error) => {
        console.error("Error al actualizar el saldo", error);
      },
    );
  }

  agregarGasto(): void {
    if (
      this.selectedCuenta &&
      this.nuevoGasto.importe > 0 &&
      this.nuevoGasto.categoria &&
      this.nuevoGasto.descripcion &&
      this.nuevoGasto.fecha
    ) {
      const gastoData = { ...this.nuevoGasto };

      this.cuentaService
        .agregarGasto(this.selectedCuenta.id, gastoData)
        .subscribe(
          () => {
            this.actualizarSaldo(this.selectedCuenta.id);
            this.gastosTotales += this.nuevoGasto.importe;
            this.ahorroMensual = this.ingresosTotales - this.gastosTotales;
            this.porcentajeAhorro =
              this.ingresosTotales > 0
                ? (this.ahorroMensual / this.ingresosTotales) * 100
                : 0;
            this.actualizarAlertas();

            // Limpiar formulario gasto
            this.nuevoGasto = {
              importe: 0,
              categoria: "",
              descripcion: "",
              fecha: "",
            };
            this.toggleFormularioGasto();
          },
          (error) => console.error("Error al agregar gasto", error),
        );
    }
  }

  agregarIngreso(): void {
    if (
      this.selectedCuenta &&
      this.nuevoIngreso.importe > 0 &&
      this.nuevoIngreso.categoria &&
      this.nuevoIngreso.descripcion &&
      this.nuevoIngreso.fecha
    ) {
      const ingresoData = { ...this.nuevoIngreso };

      this.cuentaService
        .agregarIngreso(this.selectedCuenta.id, ingresoData)
        .subscribe(
          () => {
            this.actualizarSaldo(this.selectedCuenta.id);
            this.ingresosTotales += this.nuevoIngreso.importe;
            this.ahorroMensual = this.ingresosTotales - this.gastosTotales;
            this.porcentajeAhorro =
              this.ingresosTotales > 0
                ? (this.ahorroMensual / this.ingresosTotales) * 100
                : 0;
            this.actualizarAlertas();

            // Limpiar formulario ingreso
            this.nuevoIngreso = {
              importe: 0,
              categoria: "",
              descripcion: "",
              fecha: "",
            };
            this.toggleFormularioIngreso();
          },
          (error) => console.error("Error al agregar ingreso", error),
        );
    }
  }

  irACrearCuenta(): void {
    this.router.navigate(["/crear-cuenta"]);
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

  eliminarCuenta(cuentaId: number): void {
    if (
      confirm(
        "¿Estás seguro que quieres eliminar esta cuenta? Esta acción no se puede deshacer.",
      )
    ) {
      this.cuentaService.eliminarCuenta(cuentaId).subscribe({
        next: () => {
          this.cuentas = this.cuentas.filter(
            (cuenta) => cuenta.id !== cuentaId,
          );

          if (this.selectedCuenta && this.selectedCuenta.id === cuentaId) {
            this.selectedCuenta =
              this.cuentas.length > 0 ? this.cuentas[0] : null;
            if (this.selectedCuenta) {
              this.cargarIngresosYGastos(this.selectedCuenta.id);
            } else {
              this.ingresosTotales = 0;
              this.gastosTotales = 0;
              this.saldo = 0;
              this.ahorroMensual = 0;
              this.porcentajeAhorro = 0;
              this.chart?.destroy();
            }
          }
        },
        error: (err) => {
          console.error("Error al eliminar la cuenta", err);
          alert("No se pudo eliminar la cuenta. Intenta más tarde.");
        },
      });
    }
  }

  toggleMenu() {
    this.isMenuCollapsed = !this.isMenuCollapsed;
  }
}
