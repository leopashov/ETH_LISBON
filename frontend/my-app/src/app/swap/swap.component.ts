import { AfterViewInit, Component, OnInit, ViewContainerRef, ViewChild } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { WalletService } from '../wallet.service';
import { BigNumber, ethers, Signer } from 'ethers';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-swap',
  templateUrl: './swap.component.html',
  styleUrls: ['./swap.component.scss']
})

export class SwapComponent implements OnInit, AfterViewInit {
  @ViewChild('header', {read: ViewContainerRef, static: true}) vcr!: ViewContainerRef;

  LOADING = "loading ..."
  walletAddress: string;
  wallet: ethers.Wallet | undefined | string;
  etherBalance: string | undefined | BigNumber | Number;
  provider: ethers.providers.JsonRpcProvider | string;
  signer: ethers.providers.JsonRpcSigner | undefined | string;


  constructor(private apiService: ApiService, private walletService: WalletService) {
    this.walletAddress = this.LOADING;
    this.wallet = this.LOADING;
    this.etherBalance = this.LOADING;
    this.provider = this.LOADING;
    this.signer = this.LOADING
  }

  ngOnInit(): void {
    const componentRef = this.vcr.createComponent(HeaderComponent);
    
    //if(this.walletService.walletConnected) {
      this.apiService.getEthBalance("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266").subscribe((balanceBN) => {
        const balance = ethers.utils.formatEther(balanceBN);
        this.etherBalance = balance;
      });
    //} 

  }

  ngAfterViewInit(): void {
    
  }

  buyDip() {
    
  }

}
