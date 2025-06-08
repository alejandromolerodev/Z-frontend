import { Component, OnInit } from "@angular/core";
import { UserService } from "../services/user.service"; // Servicio de usuario para login y registro
import { Router } from "@angular/router";
import { CommonModule } from "@angular/common"; // Para usar directivas comunes como *ngIf
import { FormsModule, NgForm } from "@angular/forms"; // Para trabajar con formularios reactivos

@Component({
  selector: "app-login",
  standalone: true, // Uso de componente independiente (sin módulo)
  imports: [CommonModule, FormsModule],
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.css"],
})
export class LoginComponent implements OnInit {
  // Datos del formulario
  email: string = "";
  nombre: string = "";
  password: string = "";

  // Para mensajes de error y alternar entre login/registro
  errorMessage: string = "";
  modoRegistro: boolean = false;

  constructor(
    private userService: UserService,
    private router: Router,
  ) {}

  // Al iniciar el componente, redirige si ya está autenticado
  ngOnInit(): void {
    if (this.userService.isAuthenticated()) {
      this.router.navigate(["/resumen"]);
    }
  }

  // Método para iniciar sesión
  onLogin(form: NgForm): void {
    if (form.invalid) return;

    this.userService.login(this.email, this.password).subscribe(
      (response) => {
        const userId = Number(response.userId);

        // Guarda datos del usuario (por ejemplo en localStorage)
        this.userService.setUserData(userId);

        // Pequeña espera para asegurar que los datos están listos antes de navegar
        setTimeout(() => {
          this.router.navigate(["/resumen"]);
        }, 100);
      },
      (error) => {
        this.errorMessage =
          "Error de autenticación. Verifica tus credenciales.";
      },
    );
  }

  // Método para registrar un nuevo usuario
  onRegister(form: NgForm): void {
    if (form.invalid) return;

    this.userService.register(this.email, this.password, this.nombre).subscribe(
      (response) => {
        const userId = Number(response.id);
        this.userService.setUserData(userId);

        // Redirige al resumen tras registro exitoso
        this.router.navigate(["/resumen"]);
      },
      (error) => {
        this.errorMessage = "Error al registrarse. Intenta de nuevo.";
      },
    );
  }
}
