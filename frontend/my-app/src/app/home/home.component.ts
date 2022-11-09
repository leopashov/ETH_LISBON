import { Component, OnInit } from '@angular/core';
import { ethers, Signer } from 'ethers';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})

export class HomeComponent implements OnInit {
  walletAddress: string;
  wallet: ethers.Wallet | undefined;
  etherBalance: string;
  provider: ethers.providers.JsonRpcProvider | undefined;
  signer: ethers.providers.JsonRpcSigner | undefined;


  constructor() { 
    this.walletAddress = "No Wallet connected.";
    this.etherBalance = "0.0"
    
  }

  ngOnInit(): void {
    
    
  }

  async connectWallet(){
    this.provider = new ethers.providers.Web3Provider((window as any).ethereum, "any");
    await this.provider.send("eth_requestAccounts", []);
    this.signer = this.provider.getSigner();
    this.walletAddress = await this.signer.getAddress();

  }

}
