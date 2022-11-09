import { Component, OnInit } from '@angular/core';
import { ethers, Signer } from 'ethers';
import { WalletService } from '../wallet.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})

export class HeaderComponent implements OnInit {

  walletAddress: string | undefined;
  wallet: ethers.Wallet | undefined;
  etherBalance: string | undefined;
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
  }

  async connectWallet() {
    await this.walletService.connectWallet();
    this.walletAddress = this.walletService.walletAddress;
  }

  async disconnectWallet() {
    await this.walletService.disconnectWallet();
    this.walletAddress = this.walletService.walletAddress;
  }

}
