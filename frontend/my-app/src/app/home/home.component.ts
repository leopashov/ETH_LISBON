import { AfterViewInit, Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { BigNumber, Contract, ContractInterface, ethers } from 'ethers';
import { GetContractAddressesService } from '../get-contract-addresses.service';
import { HeaderComponent } from '../header/header.component';
import { WalletService } from '../wallet.service';




@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})

export class HomeComponent implements OnInit, AfterViewInit {
  @ViewChild('header', {read: ViewContainerRef, static: true}) vcr!: ViewContainerRef;

  indexContract: Contract | undefined;
  indexContractBalance: BigNumber | undefined;
  tokenContract: Contract | undefined;
  // TOKEN_CONTRACT_ADDRESS: string ;
  // INDEX_CONTRACT_ADDRESS: string; 

  walletAddress: string | undefined;
  wallet: ethers.Wallet | undefined;
  etherBalance: string | undefined | BigNumber | Number;
  signer: ethers.providers.JsonRpcSigner | undefined;
  indexTokenAbi: ContractInterface | undefined;

   
  
  constructor(private walletService: WalletService, private getContractAddressService: GetContractAddressesService) { 
    const provider = new ethers.providers.Web3Provider((window as any).ethereum, "any");
  }

  async ngOnInit(): Promise<void> {
    const componentRef = this.vcr.createComponent(HeaderComponent);
    this.indexContractBalance = await this.getContractAddressService.getIndexBalance(this.getContractAddressService.INDEX_CONTRACT_ADDRESS);

    console.log("Ethers balance of Index Contract: " + this.indexContractBalance);
    this.etherBalance = this.indexContractBalance;
    console.log("Calling from home: " + this.getContractAddressService.indexContract.address);
    // console.log("Index Contract: " + this.indexContract);
    this.walletAddress = this.walletService.walletAddress;
    this.wallet = this.walletService.wallet;
    this.signer = this.walletService.signer;
  }

  ngAfterViewInit(): void {

  }



}
