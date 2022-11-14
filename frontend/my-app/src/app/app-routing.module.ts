import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { HeaderComponent } from './header/header.component';
import { HomeComponent } from './home/home.component';
import { SwapComponent } from './swap/swap.component';
import { WithdrawComponent } from './withdraw/withdraw.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'swap', component: SwapComponent },
  { path: 'header', component: HeaderComponent },
  { path: 'withdraw', component: WithdrawComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
