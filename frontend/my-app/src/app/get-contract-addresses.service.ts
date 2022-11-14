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
  
  signer: any
  signerAddress: string | undefined;
  provider: ethers.providers.JsonRpcProvider;

  walletConnected: boolean;


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

    this.signerAddress = "loading ...";
    this.walletConnected = false;
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

  async withdrawEth(amount: string) {
    const amountBN = ethers.utils.parseEther(amount);
    
    this.signer = this.walletService.signer;
    const initialAcc1TokenBalance = await this.tokenContract.balanceOf(this.signer.getAddress());
    console.log(`Signer initial token balance: ${initialAcc1TokenBalance}`);
    //const initialAcc1ethBalance = await deployer.getBalance(acc1.address);
    //console.log(`acc1 initial eth balance: ${initialAcc1ethBalance}`);
    const totalSupply = await this.tokenContract.totalSupply();
    console.log(`Total DIP Token Supply initial: ${totalSupply}`);
    const initialIndexValue = await this.indexContract.indexValue();
    console.log(`initial index value: ${initialIndexValue}`);
    const approvalTx = await this.tokenContract.connect(this.signer).approve(this.indexContract.address, amountBN);
    approvalTx.wait();
    console.log("approved(TS)");
    const withdrawTx = await this.indexContract.connect(this.signer).withdraw(amountBN, {"gasLimit": "10000000"});
    withdrawTx.wait();
    const finalAcc1TokenBalance = await this.tokenContract.balanceOf(this.signer.address);
    console.log(`acc1 initial token balance: ${finalAcc1TokenBalance}`);
    //const finalAcc1ethBalance = await deployer.getBalance(acc1.address);
    //console.log(`acc1 initial eth balance: ${finalAcc1ethBalance}`);
    const updateIndexValue = await this.indexContract.updateIndexValueUSD();
    await updateIndexValue.wait();
    const totalSupplyFinal = await this.tokenContract.totalSupply();
    console.log(`Total Index Token Supply final: ${totalSupplyFinal}`);
    const finalIndexValue = await this.indexContract.indexValue();
    console.log(`final index value: ${finalIndexValue}`);
    // expect(withdrawTx).to.throw(Error);
    
    
    // console.log("getService amount: " + amount);
    // const amountBN = ethers.utils.parseEther(amount);
    // const gasLimit = ethers.utils.parseEther("0.000000000001");
    // console.log("gas Limit: " + gasLimit + " wei");
    // console.log("withdraw amount BN: " + amountBN);

    // this.walletConnected = this.walletService.walletConnected;

    // this.signer = this.walletService.signer;
    // this.signerAddress = await this.signer.getAddress();
    // console.log("Signer: " + this.signerAddress);
    

    // const approvalTx = await this.tokenContract.connect(this.signer).approve(this.indexContract.address, amountBN.mul(10000));
    // await approvalTx.wait();
    // const fundTx = await this.indexContract.connect(this.signer).withdraw(amountBN, {"gasLimit": gasLimit});
    // // const fundTx = await this.indexContract.connect(this.signer).withdraw(amountBN);
    // console.log("receipt: " + fundTx);
    // await fundTx.wait();
  }

  // async rebalance() {
  //   console.log("getService amount: " + amount);
  //   const amountBN = ethers.utils.parseEther(amount);
  //   const gasLimit = ethers.utils.parseEther("0.1");
  //   console.log("gas Limit: " + gasLimit);
  //   const fundTx = await this.indexContract.connect(this.walletService.signer).withdraw(amountBN, {"gasLimit": ethers.utils.parseEther("0.1")});
  //   await fundTx.wait();
  // }

  // async
  //   this.indexContractBalance = this.getIndexBalance(this.INDEX_CONTRACT_ADDRESS);
  //     console.log("Ethers balance of Index Contract: " + this.indexContractBalance);



}



