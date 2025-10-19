import { Routes } from '@angular/router';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { CardLoginComponent } from './card-login/card-login.component';
import { RegistroUsuarioComponent } from './registro-usuario/registro-usuario.component';
import { EsqueceuSenhaComponent } from './esqueceu-senha/esqueceu-senha.component';
import { PainelGeralComponent } from './painel-geral/painel-geral.component';
import { CreateDeliveryComponent } from './create-delivery/create-delivery.component';
import { PainelLayoutComponent } from './layout/painel-layout/painel-layout.component';
import { authGuard } from './services/auth/auth.guard';
import { SolicitarSocorroComponent } from './socorros/solicitar-socorro/solicitar-socorro.component';
import { ListaEntregasComponent } from './entregas/lista-entregas/lista-entregas.component';

export const routes: Routes = [
  // --- ROTAS PÚBLICAS ---
  { path: '', component: LandingPageComponent, title: 'Bem-vindo' },
  { path: 'card-login', component: CardLoginComponent, title: 'Login' },
  { path: 'registro-usuario', component: RegistroUsuarioComponent, title: 'Registrar' },
  { path: 'esqueceu-senha', component: EsqueceuSenhaComponent, title: 'Recuperar Senha' },

  // --- ROTAS PRIVADAS / DO PAINEL ---
  {
    path: 'painel',
    component: PainelLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'geral', pathMatch: 'full' }, 
      { path: 'geral', component: PainelGeralComponent, title: 'Painel Geral' },
      { path: 'nova-entrega', component: CreateDeliveryComponent, title: 'Nova Entrega' },
      { path: 'lista-entregas', component: ListaEntregasComponent, title: 'Lista de Entregas' },
      { path: 'solicitar-socorro', component: SolicitarSocorroComponent, title: 'Solicitar Socorro' },
    ]
  },

  { path: '**', redirectTo: '' }
];
