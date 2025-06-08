import { ApplicationConfig, isDevMode } from "@angular/core";
import { provideRouter } from "@angular/router";
import { provideHttpClient } from "@angular/common/http";
import { provideServiceWorker } from "@angular/service-worker";

import { routes } from "./app.routes";

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes), // Configura el enrutador con las rutas definidas
    provideHttpClient(), // Provee el HttpClient para hacer peticiones HTTP
    provideServiceWorker("ngsw-worker.js", {
      enabled: !isDevMode(), // Habilita SW solo en producción
      registrationStrategy: "registerWhenStable:30000", // Registra SW cuando la app está estable o después de 30s
    }),
  ],
};
