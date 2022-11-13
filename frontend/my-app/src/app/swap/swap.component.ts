import { AfterViewInit, Component, OnInit, ViewContainerRef, ViewChild } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { WalletService } from '../wallet.service';
import { BigNumber, Contract, ethers, Signer } from 'ethers';
import { ApiService } from '../api.service';
import { GetContractAddressesService } from '../get-contract-addresses.service';
import { FormBuilder, ReactiveFormsModule, FormControl } from '@angular/forms';

@Component({
  selector: 'app-swap',
  templateUrl: './swap.component.html',
  styleUrls: ['./swap.component.scss']
})

export class SwapComponent implements OnInit {
  // streaming the header into this component
  @ViewChild('header', {read: ViewContainerRef, static: true}) vcr!: ViewContainerRef;

  LOADING = "loading ...";
  walletAddress: string;
  etherBalance: string | undefined | BigNumber | Number;
  provider: ethers.providers.Provider;
  totalTokenSupply: string;
  indexContract: any;
  investAmount: string;
  signer: any;

  claimForm = this.fb.group({
    amount: ''
  });



  constructor(private fb: FormBuilder, private getContractAddressService: GetContractAddressesService,  private apiService: ApiService, private walletService: WalletService) {
    this.walletAddress = this.LOADING;
    this.etherBalance = this.LOADING;
    this.provider = ethers.getDefaultProvider('http://127.0.0.1:8545/');
    this.totalTokenSupply = 'loading...';
    this.investAmount = this.LOADING;
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
        this.etherBalance = ethers.utils.formatEther(balanceBN) + " ETH";
      });
    }
  }


  invest() {
    this.investAmount = String(this.claimForm.value.amount);
    console.log("Invested amount: " + this.investAmount);
    this.getContractAddressService.investEth(this.investAmount);
  }

}
