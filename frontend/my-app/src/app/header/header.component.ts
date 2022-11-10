import { Component, OnInit } from '@angular/core';
import { BigNumber, ethers, Signer } from 'ethers';
import { WalletService } from '../wallet.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})

export class HeaderComponent implements OnInit {

  walletAddress: string | undefined;
  wallet: ethers.Wallet | undefined;
  etherBalance: string | undefined | BigNumber | Number;
  provider: ethers.providers.JsonRpcProvider | undefined;
  signer: ethers.providers.JsonRpcSigner | undefined;

  constructor(private walletService: WalletService) { 
    
  }

  ngOnInit(): void {
    this.walletAddress = this.walletService.walletAddress;
    this.wallet = this.walletService.wallet;
    this.etherBalance = this.walletService.etherBalance;
    this.provider = this.walletService.provider;
    this.signer = this.walletService.signer; 
    //console.log(this.etherBalance);
  }

  async connectWallet() {
    await this.walletService.connectWallet();
    this.walletAddress = this.walletService.walletAddress;
    this.etherBalance = this.walletService.etherBalance;
    console.log(this.walletAddress);
    console.log(this.etherBalance);
    console.log(this.provider);
    console.log(this.signer);
    console.log(this.wallet);
  }

  async disconnectWallet() {
    await this.walletService.disconnectWallet();
    this.walletAddress = this.walletService.walletAddress;
    this.etherBalance = this.walletService.etherBalance;
  }

}