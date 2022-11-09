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
  //@ViewChild(HeaderComponent, {static: true}) headerComponent!: HeaderComponent;
  @ViewChild('header', {read: ViewContainerRef, static: true}) vcr!: ViewContainerRef;

  walletAddress: string | undefined;
  wallet: ethers.Wallet | undefined;
  etherBalance: string | undefined;
  provider: ethers.providers.JsonRpcProvider | undefined;
  signer: ethers.providers.JsonRpcSigner | undefined;
  
  constructor(private walletService: WalletService) { 
   
  }

  ngOnInit(): void {
    const componentRef = this.vcr.createComponent(HeaderComponent);
    
  }

  ngAfterViewInit(): void {
   
  }

  ngAfterContentChecked(): void {
    
  }



}
