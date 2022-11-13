import { AfterContentChecked, AfterViewInit, Component, Input, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { BigNumber, Contract, ethers, Signer } from 'ethers';
import { HomeComponent } from '../home/home.component';
import { HeaderComponent } from '../header/header.component';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { WalletService } from '../wallet.service';
import { abi } from '../../../../../backend/artifacts/contracts/IndexToken.sol/IndexToken.json';
import { ApiService } from '../api.service';



@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, AfterContentChecked {
  // streaming the header into this component
  @ViewChild('header', {read: ViewContainerRef, static: true}) vcr!: ViewContainerRef;
  
  etherBalance: string;
  totalTokenSupply: string;
  walletConnected: boolean;
    
  constructor(private apiService: ApiService, private walletService: WalletService) { 
    this.totalTokenSupply = 'loading ...';
    this.etherBalance = 'loading ...';
    this.walletConnected = false;
  }

  ngOnInit(): void {
    // streaming the header into this component
    const componentRef = this.vcr.createComponent(HeaderComponent);

    this.walletConnected = this.walletService.walletConnected;

    // subscribe to total token supply from api service
    this.apiService.getTotalTokenSupply().subscribe((response) => {
      this.totalTokenSupply = response;
    });
  }
    

  ngAfterViewInit(): void {

  }

  ngAfterContentChecked(): void {
    
  }

  ngOnChanges(): void {
   
  }

  ngAfterViewChecked(): void {
    // this.walletAddress = this.walletService.walletAddress;
    // this.wallet = this.walletService.wallet;
    // this.etherBalance = this.walletService.etherBalance;
    // this.provider = this.walletService.provider;
    // this.signer = this.walletService.signer; 
    // this.dipBalance = this.walletService.dipBalance;
  }



}
