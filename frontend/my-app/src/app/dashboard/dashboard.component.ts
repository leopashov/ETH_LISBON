import { Component, OnInit } from '@angular/core';
import { ethers, Signer } from 'ethers';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  walletAddress: string;
  wallet: ethers.Wallet | undefined;
  etherBalance: string;
  provider: ethers.providers.BaseProvider;

  constructor() { 
    this.walletAddress = 'loading ...';
    this.etherBalance = 'loading ...';
    this.provider = ethers.getDefaultProvider('goerli');
  }

  ngOnInit(): void {
    this.wallet = ethers.Wallet.createRandom();
    this.walletAddress = this.wallet.address;
    this.provider.getBalance(this.walletAddress).then((balanceBN) => {
      this.etherBalance = ethers.utils.formatEther(balanceBN) + ' ETH';
    })

  }

}
