import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Câmera 1: Verificando se o interceptor está sendo executado.
  console.log('[Interceptor] Executando para a rota:', req.url);

  const authService = inject(AuthService);
  const authToken = authService.getToken();

  // Câmera 2: Verificando se o token foi encontrado.
  console.log('[Interceptor] Token encontrado no localStorage:', authToken);

  if (authToken) {
    // Câmera 3: Confirmando que o cabeçalho está sendo adicionado.
    console.log('[Interceptor] Token encontrado. Adicionando cabeçalho de autorização.');
    const authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${authToken}` }
    });
    return next(authReq);
  }

  console.warn('[Interceptor] Nenhum token encontrado. Enviando requisição sem autorização.');
  return next(req);
};