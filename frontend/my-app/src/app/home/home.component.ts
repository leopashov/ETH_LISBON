import { AfterViewInit, Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { WalletService } from '../wallet.service';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})

export class HomeComponent implements OnInit, AfterViewInit {
  @ViewChild('header', {read: ViewContainerRef, static: true}) vcr!: ViewContainerRef;

  constructor(private walletService: WalletService) { 
  
  }

  ngOnInit(): void {
    const componentRef = this.vcr.createComponent(HeaderComponent);
    
  }

  ngAfterViewInit(): void {

  }

}
