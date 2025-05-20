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

  cuentas: any[] = [];
  selectedCuenta: any = null;
  chart: any = null;

  // Campos para ingreso
  nuevoIngreso: number = 0;
  ingresoCategoria: string = "";
  ingresoDescripcion: string = "";
  ingresoFecha: string = "";

  // Campos para gasto
  nuevoGasto: number = 0;
  gastoCategoria: string = "";
  gastoDescripcion: string = "";
  gastoFecha: string = "";

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

        this.alertas = [];
        if (this.porcentajeAhorro < 20) {
          this.alertas.push(
            "Cuidado, tu porcentaje de ahorro está por debajo del 20% recomendado.",
          );
        }

        this.dibujarGrafica();
      },
      (error) => {
        console.error("Error al obtener ingresos o gastos", error);
      },
    );
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
      this.nuevoGasto > 0 &&
      this.gastoCategoria &&
      this.gastoDescripcion &&
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
            this.actualizarSaldo(this.selectedCuenta.id);
            this.gastosTotales += this.nuevoGasto;
            this.ahorroMensual = this.ingresosTotales - this.gastosTotales;
            this.porcentajeAhorro =
              this.ingresosTotales > 0
                ? (this.ahorroMensual / this.ingresosTotales) * 100
                : 0;
            this.alertas = [];
            if (this.porcentajeAhorro < 20) {
              this.alertas.push(
                "Cuidado, tu porcentaje de ahorro está por debajo del 20% recomendado.",
              );
            }

            this.nuevoGasto = 0;
            this.gastoCategoria = "";
            this.gastoDescripcion = "";
            this.gastoFecha = "";
            this.toggleFormularioGasto();
          },
          (error) => console.error("Error al agregar gasto", error),
        );
    }
  }

  agregarIngreso(): void {
    if (
      this.selectedCuenta &&
      this.nuevoIngreso > 0 &&
      this.ingresoCategoria &&
      this.ingresoDescripcion &&
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
            this.actualizarSaldo(this.selectedCuenta.id);
            this.ingresosTotales += this.nuevoIngreso;
            this.ahorroMensual = this.ingresosTotales - this.gastosTotales;
            this.porcentajeAhorro =
              this.ingresosTotales > 0
                ? (this.ahorroMensual / this.ingresosTotales) * 100
                : 0;
            this.alertas = [];
            if (this.porcentajeAhorro < 20) {
              this.alertas.push(
                "Cuidado, tu porcentaje de ahorro está por debajo del 20% recomendado.",
              );
            }

            this.nuevoIngreso = 0;
            this.ingresoCategoria = "";
            this.ingresoDescripcion = "";
            this.ingresoFecha = "";
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
      // Aquí puedes agregar la lógica para cerrar sesión, por ejemplo:
      this.authService.logout(); // si tienes un método logout en el servicio Auth
      localStorage.removeItem("userId"); // limpia el localStorage
      this.router.navigate(["/login"]); // redirige al login
    }
  }

  mostrarInfoCreador(): void {
    alert(
      "👨‍💻 Nombre: Alejandro Molero Torres\n📅 Fecha de creación: 6 de junio de 2025\n\nGracias por utilizar esta plataforma de gestión financiera.",
    );
  }

  toggleMenu() {
    this.isMenuCollapsed = !this.isMenuCollapsed;
  }
}
