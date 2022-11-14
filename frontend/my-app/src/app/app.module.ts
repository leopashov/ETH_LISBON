import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { SwapComponent } from './swap/swap.component';
import { HeaderComponent } from './header/header.component';
import { ReactiveFormsModule } from '@angular/forms';
import { WithdrawComponent } from './withdraw/withdraw.component';


@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    DashboardComponent,
    SwapComponent,
    HeaderComponent,
    WithdrawComponent
  ],
  imports: [
    HttpClientModule,
    BrowserModule,
    NgbModule,
    AppRoutingModule,
    ReactiveFormsModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
