import { AfterContentChecked, AfterViewInit, Component, Input, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { BigNumber, Contract, ethers, Signer } from 'ethers';
import { HomeComponent } from '../home/home.component';
import { HeaderComponent } from '../header/header.component';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { WalletService } from '../wallet.service';
import { abi } from '../../../../../backend/artifacts/contracts/IndexToken.sol/IndexToken.json';
import { ApiService } from '../api.service';


const ETH_USD_PRICE: number = 1237.23;

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
  dipBalance: string | number;
  walletConnected: boolean;
  walletAddress: string | undefined;
  allowance: string | undefined | number;
  usdDipBalance: string | number;
    
  constructor(private apiService: ApiService, private walletService: WalletService) { 
    this.totalTokenSupply = 'loading ...';
    this.dipBalance = "loading ...";
    this.usdDipBalance = "loading ...";
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

    
    // this.apiService.getAllowance("0x976EA74026E726554dB657fA54763abd0C3a0aa9", "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc").subscribe((response) => {
    //   this.allowance = response.result;
    //   console.log(this.allowance);
    // });

    
    // console.log(this.allowance);

    // subscribe to dip balance from api service if wallet is connected
    if(this.walletConnected) {
      this.walletAddress = this.walletService.walletAddress;
      console.log(this.walletAddress);
      this.apiService.getDipBalance(this.walletAddress).subscribe((response) => {
        this.dipBalance = response;
        this.usdDipBalance = Number(this.dipBalance) * ETH_USD_PRICE;
    });
    
    
    } else {
      this.totalTokenSupply = "--";
      this.dipBalance = "--";
    }

    
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
