import { AfterViewInit, Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { BigNumber, Contract, ContractInterface, ethers } from 'ethers';
import { ApiService } from '../api.service';
import { GetContractAddressesService } from '../get-contract-addresses.service';
import { HeaderComponent } from '../header/header.component';
import { WalletService } from '../wallet.service';


const INDEX_CONTRACT_ADDRESS = '0x3D63c50AD04DD5aE394CAB562b7691DD5de7CF6f';
const ETH_USD_PRICE: number = 1237;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})

export class HomeComponent implements OnInit, AfterViewInit {
  // streaming the header into this component
  @ViewChild('header', {read: ViewContainerRef, static: true}) vcr!: ViewContainerRef;

  tokenContractBalance: string | number;
  totalTokenSupply: string | number;
  provider = ethers.getDefaultProvider('http://127.0.0.1:8545/');
  etherBalance: string;



  constructor(private apiService: ApiService, private walletService: WalletService, private getContractAddressService: GetContractAddressesService) { 
    this.tokenContractBalance = "loading ...";
    this.totalTokenSupply = "loading ...";
    this.etherBalance = "loading ...";
  }

  ngOnInit(): void {
    // streaming the header into this component
    const componentRef = this.vcr.createComponent(HeaderComponent);
    
    this.apiService.getTotalTokenSupply().subscribe((response) => {
      this.totalTokenSupply = response;
    });
      
    this.provider.getBalance(INDEX_CONTRACT_ADDRESS).then((balanceBN) => {
      const tokenContractBalanceEth = Number(ethers.utils.formatEther(balanceBN));
      this.tokenContractBalance =  tokenContractBalanceEth * ETH_USD_PRICE;
    });

  }

  ngAfterViewInit(): void {

  }

}
