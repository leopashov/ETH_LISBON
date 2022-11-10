import { AfterContentChecked, AfterViewInit, Component, Input, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { BigNumber, Contract, ethers, Signer } from 'ethers';
import { HomeComponent } from '../home/home.component';
import { HeaderComponent } from '../header/header.component';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { WalletService } from '../wallet.service';
import { abi } from '../../../../../backend/artifacts/contracts/IndexToken.sol/IndexToken.json';



@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, AfterViewInit, AfterContentChecked {
  @ViewChild('header', {read: ViewContainerRef, static: true}) vcr!: ViewContainerRef;
  
  
  walletAddress: string | undefined;
  wallet: ethers.Wallet | undefined;
  etherBalance: string | undefined | BigNumber | Number;
  provider: ethers.providers.JsonRpcProvider | undefined;
  signer: ethers.providers.JsonRpcSigner | undefined;
  
  indexTokenContract: Contract | undefined;
  
  // indexMarketCap: BigNumber | Number;
  // 0-Address Hardhat Signer
  


  // console.log("provider: " + this.provider);
  
  
  // const provider = new ethers.providers.Web3Provider((window as any).ethereum, "any");
  // const indexTokenContract = new ethers.Contract("0x3D63c50AD04DD5aE394CAB562b7691DD5de7CF6f", IndexTokenAbi, provider);

  // tokenContract: Contract;
  // indexContract: Contract;
  
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
