import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('[Interceptor] Executando para a rota:', req.url);

  const authService = inject(AuthService);
  const authToken = authService.getToken();
  console.log('[Interceptor] Token encontrado no localStorage:', authToken);

  if (authToken) {
    console.log('[Interceptor] Token encontrado. Adicionando cabeçalho de autorização.');
    const authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${authToken}` }
    });
    return next(authReq);
  }

  console.warn('[Interceptor] Nenhum token encontrado. Enviando requisição sem autorização.');
  return next(req);
};