import { Injectable } from '@angular/core';
import { ethers, Signer } from 'ethers';

@Injectable({
  providedIn: 'root'
})
export class WalletService {

  walletAddress: string | undefined;
  wallet: ethers.Wallet | undefined;
  etherBalance: string | undefined;
  provider: ethers.providers.JsonRpcProvider | undefined;
  signer: ethers.providers.JsonRpcSigner | undefined;
  
  constructor() { }

  async connectWallet(){
    console.log("provider: " + this.provider);
    this.provider = new ethers.providers.Web3Provider((window as any).ethereum, "any");
    await this.provider.send("eth_requestAccounts", []);
    console.log("provider: " + this.provider);
    this.signer = this.provider.getSigner();
    this.walletAddress = await this.signer.getAddress();
  }

  async disconnectWallet(){
    this.provider = undefined;
    this.walletAddress = undefined;
    this.etherBalance = "0.0";
    this.signer = undefined;
    this.wallet = undefined;
    console.log("Wallet Address after disconnect provider: " + this.walletAddress);
    console.log("provider after disconnect provider: " + this.provider);
    console.log("signer after disconnect provider: " + this.signer);
    console.log("Wallet Address after disconnect provider: " + this.walletAddress);
  }

}
