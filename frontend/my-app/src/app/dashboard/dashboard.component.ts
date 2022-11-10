import { AfterContentChecked, AfterViewInit, Component, Input, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { BigNumber, ethers, Signer } from 'ethers';
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
  @Input() 
  
  walletAddress: string | undefined;
  wallet: ethers.Wallet | undefined;
  etherBalance: string | undefined | BigNumber | Number;
  provider: ethers.providers.JsonRpcProvider | undefined;
  signer: ethers.providers.JsonRpcSigner | undefined;
  
  constructor(private walletService: WalletService) { 
    
  }

  ngOnInit(): void {
    const componentRef = this.vcr.createComponent(HeaderComponent);
    this.walletAddress = this.walletService.walletAddress;
    this.wallet = this.walletService.wallet;
    this.etherBalance = this.walletService.etherBalance;
    this.provider = this.walletService.provider;
    this.signer = this.walletService.signer; 
    
  }

  ngAfterViewInit(): void {

  }

  ngAfterContentChecked(): void {
    
  }

  ngOnChanges(): void {
   
  }

  ngAfterViewChecked(): void {
    this.walletAddress = this.walletService.walletAddress;
    this.wallet = this.walletService.wallet;
    this.etherBalance = this.walletService.etherBalance;
    this.provider = this.walletService.provider;
    this.signer = this.walletService.signer; 
  }



}
