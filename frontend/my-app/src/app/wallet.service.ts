import { Injectable } from '@angular/core';
import { BigNumber, Contract, ethers, Signer } from 'ethers';
import { GetContractAddressesService } from './get-contract-addresses.service';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class WalletService {

  walletAddress: string;
  wallet: ethers.Wallet | undefined;
  provider: ethers.providers.JsonRpcProvider | undefined;
  // newProvider: ethers.providers.Provider | undefined;
  signer: ethers.providers.JsonRpcSigner | undefined;
  indexContract: Contract;
  tokenContract: Contract;
  totalTokenSupply: string | undefined;
  walletConnected: boolean;

  

  
  constructor(private getContractAddressService: GetContractAddressesService, private apiService: ApiService) {
    this.indexContract = this.getContractAddressService.indexContract;
    this.tokenContract = this.getContractAddressService.tokenContract;
    this.walletConnected = false;
    this.walletAddress = "not connected";

  }

  async connectWallet() {
    this.provider = new ethers.providers.Web3Provider((window as any).ethereum, "any");
    
    // this.provider = this.getContractAddressService.provider;
    await this.provider.send("eth_requestAccounts", []);
    console.log("Web3 Provider: " + this.provider);

    this.signer = this.provider.getSigner();
    console.log("Web3 Signer: " + this.signer)

    this.walletAddress = await this.signer.getAddress();
    console.log("APP: wallet.service.ts wallet address: " + this.walletAddress);

    // this.provider = ethers.getDefaultProvider('http://127.0.0.1:8545/');

    this.walletConnected = true;

    // this.provider.getBalance("this.walletAddress").then((balanceBN) => {
    //   const balance = ethers.utils.formatEther(balanceBN);
    //   console.log(balance);
    // });

    // const newWalletAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
    // this.apiService.getEthBalance(newWalletAddress).subscribe((response) => {
    //   console.log(response);
    // });

    // this.apiService.getTotalTokenSupply().subscribe((response) => {
    //   console.log(response);
    //   this.totalTokenSupply = response;
    // });

  }

  async disconnectWallet(){
    this.provider = undefined;
    this.walletAddress = "not connected";
    this.signer = undefined;
    this.wallet = undefined;
    console.log("Wallet Address after disconnect provider: " + this.walletAddress);
    console.log("provider after disconnect provider: " + this.provider);
    console.log("signer after disconnect provider: " + this.signer);
    console.log("Wallet Address after disconnect provider: " + this.walletAddress);
    this.walletConnected = false;
  }

  getTotalTokenSupply(): string {
    return 'potato';
  }

  // getTokenBalance(walletAddress: any) {
  //   const balance = this.tokenContract['balanceOf'](walletAddress);
  //   return balance;
  // }



}
