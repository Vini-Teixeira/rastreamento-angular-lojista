import { provideServerRouting, ServerRoute, RenderMode } from '@angular/ssr';
import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { appConfig } from './app.config';

const serverPaths = [
  '', // raiz -> '/'
  'card-login',
  'registro-usuario',
  'esqueceu-senha',

  // painel e filhos
  'painel',
  'painel/geral',
  'painel/nova-entrega',
  'painel/lista-entregas',
  'painel/solicitar-socorro',
  '**'
];

const serverRoutes: ServerRoute[] = serverPaths.map((path) => ({ 
  path,
  renderMode: RenderMode.Server
}));

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRouting(serverRoutes)
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);