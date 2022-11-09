import { AfterViewInit, Component, OnInit, ViewContainerRef, ViewChild } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { WalletService } from '../wallet.service';
import { ethers, Signer } from 'ethers';

@Component({
  selector: 'app-swap',
  templateUrl: './swap.component.html',
  styleUrls: ['./swap.component.scss']
})

export class SwapComponent implements OnInit, AfterViewInit {
  @ViewChild('header', {read: ViewContainerRef, static: true}) vcr!: ViewContainerRef;

  walletAddress: string | undefined;
  wallet: ethers.Wallet | undefined;
  etherBalance: string | undefined;
  provider: ethers.providers.JsonRpcProvider | undefined;
  signer: ethers.providers.JsonRpcSigner | undefined;

  constructor(private walletService: WalletService) {
    this.walletAddress = this.walletService.walletAddress;
    this.wallet = this.walletService.wallet;
    this.etherBalance = this.walletService.etherBalance;
    this.provider = this.walletService.provider;
    this.signer = this.walletService.signer; 
  }

  ngOnInit(): void {
    const componentRef = this.vcr.createComponent(HeaderComponent);
    console.log(componentRef.instance.walletAddress);
  }

  ngAfterViewInit(): void {
    
  }

}
