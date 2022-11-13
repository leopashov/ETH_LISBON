import { Injectable } from '@angular/core';
import { ethers, Contract, BigNumber, ContractInterface } from 'ethers';
import * as TokenContractAbi from '../../../../backend/artifacts/contracts/IndexToken.sol/IndexToken.json';
import * as IndexContractAbi from '../../../../backend/artifacts/contracts/IndexContract.sol/IndexContract.json';
import { WalletService } from './wallet.service';


@Injectable({
  providedIn: 'root'
})

export class GetContractAddressesService {
  indexContractAbi: any;
  tokenContractAbi: any;

  indexContract: any;
  indexContractBalance: BigNumber | undefined;
  tokenContract: any;
  TOKEN_CONTRACT_ADDRESS: string;
  INDEX_CONTRACT_ADDRESS: string; 

  provider: ethers.providers.JsonRpcProvider;


  constructor(private walletService: WalletService) {
    this.indexContractAbi = IndexContractAbi;
    this.tokenContractAbi = TokenContractAbi;
    this.provider = new ethers.providers.Web3Provider((window as any).ethereum, 'any');

    this.TOKEN_CONTRACT_ADDRESS = "0x90c84237fDdf091b1E63f369AF122EB46000bc70";
    this.INDEX_CONTRACT_ADDRESS = "0x3D63c50AD04DD5aE394CAB562b7691DD5de7CF6f";
    this.tokenContract = new ethers.Contract(this.TOKEN_CONTRACT_ADDRESS, this.tokenContractAbi.abi, this.provider);
    this.indexContract = new ethers.Contract(this.INDEX_CONTRACT_ADDRESS, this.indexContractAbi.abi, this.provider);
    console.log("Token Contract Address: " + this.tokenContract.address);
    console.log("Index Contract Address: " + this.indexContract.address);
    console.log("Index Contract Object: " + this.indexContract);

  }

  async getIndexBalance(contractAddress: any) {
    let contractBalance;
      contractBalance = await this.provider.getBalance(contractAddress);
    return contractBalance;
  }

  async investEth(amount: string) {
    console.log(amount);
    const fundTx = await this.indexContract.connect(this.walletService.signer).receive_funds({ "value": ethers.utils.parseEther(amount) });
    await fundTx.wait();
  }

  // async
  //   this.indexContractBalance = this.getIndexBalance(this.INDEX_CONTRACT_ADDRESS);
  //     console.log("Ethers balance of Index Contract: " + this.indexContractBalance);



}



