import { Routes } from '@angular/router';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { CardLoginComponent } from './card-login/card-login.component';
import { RegistroUsuarioComponent } from './registro-usuario/registro-usuario.component';
import { EntregadoresComponent } from './entregadores/entregadores.component';
import { EsqueceuSenhaComponent } from './esqueceu-senha/esqueceu-senha.component';
import { PainelGeralComponent } from './painel-geral/painel-geral.component';
import { PerfilEntregadoresComponent } from './perfil-entregadores/perfil-entregadores.component';
import { RelatorioEntregasComponent } from './relatorio-entregas/relatorio-entregas.component';

export const routes: Routes = [
    { path: '', component: LandingPageComponent, title: 'Landing Page' },
    { path: 'card-login', component: CardLoginComponent, title: 'Login' },
    { path: 'esqueceu-senha', component: EsqueceuSenhaComponent, title: 'Esqueceu sua senha?' },
    { path: 'registro-usuario', component: RegistroUsuarioComponent, title: 'Registrar usuário' },
    { path: 'painel-geral', component: PainelGeralComponent, title: 'Painel geral'},
    { path: 'relatorio-entregas', component: RelatorioEntregasComponent, title: 'Relatório' },
    { path: 'entregadores', component: EntregadoresComponent, title: 'Entregadores' },
    { path: 'perfil-entregadores', component: PerfilEntregadoresComponent, title: 'Perfil de entregadores' }
];