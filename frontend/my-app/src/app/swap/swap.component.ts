import { AfterViewInit, Component, OnInit, ViewContainerRef, ViewChild } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { WalletService } from '../wallet.service';
import { BigNumber, ethers, Signer } from 'ethers';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-swap',
  templateUrl: './swap.component.html',
  styleUrls: ['./swap.component.scss']
})

export class SwapComponent implements OnInit, AfterViewInit {
  @ViewChild('header', {read: ViewContainerRef, static: true}) vcr!: ViewContainerRef;

  LOADING = "loading ...";
  walletAddress: string;
  // wallet: ethers.Wallet | undefined | string;
  etherBalance: string | undefined | BigNumber | Number;
  provider: ethers.providers.Provider;
  // signer: ethers.providers.JsonRpcSigner | undefined | string;
  totalTokenSupply: string;


  constructor(private apiService: ApiService, private walletService: WalletService) {
    this.walletAddress = this.LOADING;
    // this.walletAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
    this.etherBalance = this.LOADING;
    this.provider = ethers.getDefaultProvider('http://127.0.0.1:8545/');
    
    // this.signer = this.LOADING
    this.totalTokenSupply = 'loading...';
  }

  async ngOnInit(): Promise<void> {
    const componentRef = this.vcr.createComponent(HeaderComponent);

    
    // console.log("Network: " + await this.provider.getNetwork());
    // this.etherBalance = await this.provider.getBalance(this.walletAddress);
    
    
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

  ngAfterViewInit(): void {
    
  }

  buyDip() {
    
  }

}
