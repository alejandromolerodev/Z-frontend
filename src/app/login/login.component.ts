import { Component, OnInit } from "@angular/core";
import { UserService } from "../services/user.service"; // Asegúrate de que el servicio tenga el nombre correcto
import { Router } from "@angular/router";
import { CommonModule } from "@angular/common"; // Necesario para trabajar con formularios
import { FormsModule, NgForm } from "@angular/forms"; // Necesario para trabajar con formularios

@Component({
  selector: "app-login",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.css"],
})
export class LoginComponent implements OnInit {
  email: string = "";
  nombre: string = "";
  password: string = "";
  errorMessage: string = "";
  modoRegistro: boolean = false;

  constructor(
    private userService: UserService, // Cambié el nombre del servicio a UserService
    private router: Router,
  ) {}

  ngOnInit(): void {
    // Si el usuario ya está autenticado, redirige al resumen
    if (this.userService.isAuthenticated()) {
      this.router.navigate(["/resumen"]);
    }
  }

  onLogin(form: NgForm): void {
    if (form.invalid) return;
    this.userService.login(this.email, this.password).subscribe(
      (response) => {
        const userId = Number(response.userId);
        this.userService.setUserData(userId);

        // Espera un pequeño tiempo para asegurarte que el localStorage está actualizado
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

  onRegister(form: NgForm): void {
    if (form.invalid) return;
    // Realiza la llamada al backend para registrar al usuario
    this.userService.register(this.email, this.password, this.nombre).subscribe(
      (response) => {
        const userId = Number(response.id); // Asegúrate de que sea un número
        this.userService.setUserData(userId); // Pasa el nombre al servicio AuthService
        this.router.navigate(["/resumen"]);
      },
      (error) => {
        this.errorMessage = "Error al registrarse. Intenta de nuevo.";
      },
    );
  }
}
