import { AfterContentChecked, AfterViewInit, Component, Input, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { ethers, Signer } from 'ethers';
import { HomeComponent } from '../home/home.component';
import { HeaderComponent } from '../header/header.component';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { WalletService } from '../wallet.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, AfterViewInit, AfterContentChecked {
  @ViewChild('header', {read: ViewContainerRef, static: true}) vcr!: ViewContainerRef;
  
  
  
  constructor(private walletService: WalletService) { 
   console.log(this.walletService.walletAddress)
  }

  ngOnInit(): void {
    const componentRef = this.vcr.createComponent(HeaderComponent);
    
  }

  ngAfterViewInit(): void {
   
  }

  ngAfterContentChecked(): void {
    
  }



}
