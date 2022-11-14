import { AfterViewInit, Component, OnInit, ViewContainerRef, ViewChild } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { WalletService } from '../wallet.service';
import { BigNumber, Contract, ethers, Signer } from 'ethers';
import { ApiService } from '../api.service';
import { GetContractAddressesService } from '../get-contract-addresses.service';
import { FormBuilder, ReactiveFormsModule, FormControl } from '@angular/forms';

@Component({
  selector: 'app-withdraw',
  templateUrl: './withdraw.component.html',
  styleUrls: ['./withdraw.component.scss']
})
export class WithdrawComponent implements OnInit {
 // streaming the header into this component
 @ViewChild('header', {read: ViewContainerRef, static: true}) vcr!: ViewContainerRef;

 LOADING = "loading ...";
 ETH_USD_PRICE: string | number;
 walletAddress: string;
 etherBalance: string | undefined | BigNumber | Number;
 provider: ethers.providers.Provider;
 totalTokenSupply: string;
 indexContract: any;
 withdrawAmount: string;
 signer: any;
 dipTokenValue: string | number;
 displayDipTokenValue: string | number;
 indexValueUSD: string | number; 
 walletConnected: boolean;
 dipBalance: string | number;
 usdDipBalance: string | number;

 claimForm = this.fb.group({
   amount: ''
 });



 constructor(private fb: FormBuilder, private getContractAddressService: GetContractAddressesService,  private apiService: ApiService, private walletService: WalletService) {
    this.ETH_USD_PRICE = "loading ...";
    this.walletAddress = this.LOADING;
    this.etherBalance = this.LOADING;
    this.provider = ethers.getDefaultProvider('http://127.0.0.1:8545/');
    this.totalTokenSupply = 'loading...';
    this.withdrawAmount = this.LOADING;
    this.dipTokenValue = "loading ...";
    this.displayDipTokenValue = "loading ...";
    this.dipBalance = "loading ...";
    this.usdDipBalance = "loading ...";
    this.indexValueUSD = "loading ...";
    this.walletConnected = false;
 }

 ngOnInit(): void{
   // streaming the header into this component
   const componentRef = this.vcr.createComponent(HeaderComponent);
   this.indexContract = this.getContractAddressService.indexContract;
   
   this.apiService.getTotalTokenSupply().subscribe((response) => {
     console.log("Dashboard component token supply: " + response);
     this.totalTokenSupply = response;
   });

   if(this.walletService.walletConnected) {
     this.walletAddress = this.walletService.walletAddress;
     this.provider.getBalance(this.walletAddress).then((balanceBN) => {
       this.etherBalance = Number(ethers.utils.formatEther(balanceBN)).toFixed(4);
     });
   } 
   else {
     this.etherBalance = "--"
   }

   // subscribe to total token supply from api service
   this.apiService.getTotalTokenSupply().subscribe((response) => {
   this.totalTokenSupply = response;
   });

   this.apiService.getIndexValue().subscribe((response) => {
   //const indexValueBN = response;
   this.indexValueUSD = ethers.utils.formatEther(response);

   this.dipTokenValue = Number(this.indexValueUSD)/Number(this.totalTokenSupply);
   this.displayDipTokenValue = this.dipTokenValue.toFixed(2);

   });

    // subscribe to dip balance from api service if wallet is connected
    if(this.walletService.walletConnected) {
      this.walletAddress = this.walletService.walletAddress;
      console.log(this.walletAddress);
      this.apiService.getDipBalance(this.walletAddress).subscribe((response) => {
        this.dipBalance = response;
        console.log("Dip Balance: " + this.dipBalance);
        this.usdDipBalance = (Number(this.dipBalance) * Number(this.ETH_USD_PRICE)).toFixed(2);
    })
    } else {
      this.dipBalance = "--";
    }

 }

 
 withdraw() {
  this.withdrawAmount = String(this.claimForm.value.amount);
  // const ethDipRatio = this.totalTokenSupply
  // const receivedDip = this.claimForm.value.amount;
  console.log("Withdraw amount: " + this.withdrawAmount);
  this.getContractAddressService.withdrawEth(this.withdrawAmount);
}

}
