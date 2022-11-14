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
  
  ETH_USD_PRICE: string | number;
  WBTC_USD_PRICE: string | number;
  etherBalance: string;
  totalTokenSupply: string;
  indexValueUSD: string | number;
  dipTokenValue: string | number;
  displayDipTokenValue: string | number;
  dipBalance: string | number;
  walletConnected: boolean;
  walletAddress: string | undefined;
  allowance: string | undefined | number;
  usdDipBalance: string | number;
    
  constructor(private apiService: ApiService, private walletService: WalletService) { 
    this.ETH_USD_PRICE = "loading ...";
    this.WBTC_USD_PRICE = "loading ...";
    this.ETH_USD_PRICE = "loading ...";
    this.totalTokenSupply = 'loading ...';
    this.indexValueUSD = "loading ...";
    this.dipTokenValue = "loading ...";
    this.displayDipTokenValue = "loading ...";
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

    this.apiService.getIndexValue().subscribe((response) => {
      //const indexValueBN = response;
      this.indexValueUSD = ethers.utils.formatEther(response);
      console.log("total token supply: " + this.totalTokenSupply);
      if (Number(this.totalTokenSupply) != 0) {
        this.dipTokenValue = Number(this.indexValueUSD)/Number(this.totalTokenSupply);
        this.displayDipTokenValue = this.dipTokenValue.toFixed(2);
      } 
      else { 
        this.dipTokenValue = 0;
        this.displayDipTokenValue = "--";
        console.log("dip token value 0?: " + this.dipTokenValue);
      }
    });

    this.apiService.getWbtcUsdPrice().subscribe((response) => {
      this.WBTC_USD_PRICE = response.toFixed(2);
    })

    this.apiService.getEthUsdPrice().subscribe((response) => {
      this.ETH_USD_PRICE = response.toFixed(2);
    })



    // subscribe to dip balance from api service if wallet is connected
    if(this.walletConnected) {
      this.walletAddress = this.walletService.walletAddress;
      console.log(this.walletAddress);
      this.apiService.getDipBalance(this.walletAddress).subscribe((response) => {
        this.dipBalance = response;
        this.usdDipBalance = (Number(this.dipBalance) * Number(this.ETH_USD_PRICE)).toFixed(2);
    })
    } else {
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
