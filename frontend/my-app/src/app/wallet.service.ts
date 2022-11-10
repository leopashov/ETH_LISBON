import { Injectable } from '@angular/core';
import { BigNumber, Contract, ethers, Signer } from 'ethers';
import { GetContractAddressesService } from './get-contract-addresses.service';

@Injectable({
  providedIn: 'root'
})
export class WalletService {

  walletAddress: string | undefined;
  wallet: ethers.Wallet | undefined;
  etherBalance: string | undefined | BigNumber | Number;
  provider: ethers.providers.JsonRpcProvider | undefined;
  signer: ethers.providers.JsonRpcSigner | undefined;
  indexContract: Contract;
  tokenContract: Contract;
  
  constructor(private getContractAddressService: GetContractAddressesService) {
    this.indexContract = this.getContractAddressService.indexContract;
    this.tokenContract = this.getContractAddressService.tokenContract;
  }

  async connectWallet() {
    
    console.log("provider: " + this.provider);
   // this.provider = new ethers.providers.Web3Provider((window as any).ethereum, "any");
    this.provider = this.getContractAddressService.provider;
    await this.provider.send("eth_requestAccounts", []);
    console.log("provider: " + this.provider);
    this.signer = this.provider.getSigner();
    this.walletAddress = await this.signer.getAddress();
    const balanceBN = await this.signer.getBalance();
    const balance = Number(ethers.utils.formatEther(balanceBN));
    this.etherBalance = balance;

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

  async getTokenBalance(walletAddress: any) {
    
    // const balance = await this.tokenContract.balanceOf(walletAddress);
  }



}
