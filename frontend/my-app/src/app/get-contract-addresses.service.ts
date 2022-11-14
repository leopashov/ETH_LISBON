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
    console.log("Wallet Service: Token Contract Address: " + this.tokenContract.address);
    console.log("Wallet Service: Index Contract Address: " + this.indexContract.address);
    console.log("Wallet Service: Index Contract Object: " + this.indexContract);

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

  async balance() {
    const balanceTX = await this.indexContract.connect(this.walletService.signer).balanceFund();
    await balanceTX.wait();
  }

  async getAwbtsOnContractValue() {
    const aWbtcOnContractValue = await this.indexContract.aWbtcOnContractValue();
   
    return aWbtcOnContractValue;
  }



  async withdrawEth(wdAmount: string) {
    const wdAmountBN = ethers.utils.parseEther(wdAmount);
    console.log("Withdraw amount BN: " + wdAmountBN);

    this.signer = this.walletService.signer;
    this.signerAddress = await this.signer.getAddress();
    console.log(this.signerAddress);
    const initialAcc1TokenBalance = await this.tokenContract.balanceOf(this.signer.getAddress());
    console.log(`Signer initial token balance: ${initialAcc1TokenBalance}`);
    //const initialAcc1ethBalance = await deployer.getBalance(acc1.address);
    //console.log(`acc1 initial eth balance: ${initialAcc1ethBalance}`);
    const totalSupply = await this.tokenContract.totalSupply();
    console.log(`Total DIP Token Supply initial: ${totalSupply}`);
    const initialIndexValue = await this.indexContract.indexValue();
    console.log(`initial index value: ${initialIndexValue}`);
    const approvalTx = await this.tokenContract.connect(this.signer).approve(this.indexContract.address, wdAmountBN.mul(10));
    await approvalTx.wait();
    console.log("approved(TS)");
    const withdrawTx = await this.indexContract.connect(this.signer).withdraw(wdAmountBN);
    await withdrawTx.wait();
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
  }



}



