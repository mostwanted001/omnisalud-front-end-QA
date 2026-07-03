import { AuthService } from './../../../core/services/auth.service';
import { CommonModule, NgClass } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, EMPTY, finalize } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
})
export class LoginComponent  {

  constructor() { }
// Inyecciones
private readonly fb = inject(FormBuilder);
private readonly auth = inject(AuthService);
private readonly router = inject(Router);

// Estados
readonly isLoading = signal(false);
readonly errorMessage = signal<string | null>(null);

showPassword = false;

// Formulario con tipado estricto
readonly loginForm = this.fb.nonNullable.group({
  email: ['', [Validators.required, Validators.email]],
  password: ['', Validators.required]
});

onLogin() {
  if (this.loginForm.invalid) return;

  // Aquí usamos los valores del formulario
  this.auth.login(this.loginForm.getRawValue()).subscribe({
    next: (res) => {
      const path = res.user.role === 'ADMIN' ? '/admin' : 'app/agenda/diaria';
      this.router.navigate([path]);
    },
    error: (err) => {
      console.error("Login fallido", err);
      // Aquí podrías añadir una notificación visual al usuario
    }
  });
}
}


