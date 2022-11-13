// EXPECTED DEPLOYMENT ADDRESSES (CHECK):
// Token Contract deployed to:0x90c84237fDdf091b1E63f369AF122EB46000bc70
// Index Contract deployed to:0x3D63c50AD04DD5aE394CAB562b7691DD5de7CF6f
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
// connect just using ethers nicer; fewer dependencies etc
// hardhat has lots of baggage
// connect to testnet from 1:00:00
import * as dotenv from "dotenv";
import { errorMonitor } from "events";
import { IndexContract } from '../typechain-types/contracts/IndexContract.sol';
import { IndexToken } from "../typechain-types/contracts";
import { PromiseOrValue } from "../typechain-types/common";
dotenv.config();


async function main() {
    let tokenContract: IndexToken;
    let indexContract: IndexContract;
    let accounts: SignerWithAddress[] | { address: PromiseOrValue<string>; }[];
    let wEthContractAddress: string;
    let wBtcContractAddress: string;
    let aWBTC: string;
    let aWEth: string;
    //let deployer: SignerWithAddress[] | { address: PromiseOrValue<string>; }[];

    wEthContractAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    wBtcContractAddress = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";

    aWBTC = "0x9ff58f4fFB29fA2266Ab25e75e2A8b3503311656";
    aWEth = "0x030bA81f1c18d280636F32af80b9AAd02Cf0854e";

    // [deployer, acc1, acc2, token1, token2, token3, atoken1, atoken2, atoken3] = await ethers.getSigners();
    accounts = await ethers.getSigners();
    const tokenFactory = await ethers.getContractFactory("IndexToken"); // "IndexToken" matches import
    tokenContract = await tokenFactory.deploy();
    await tokenContract.deployed();

    // console.log(tokenContract.deployTransaction);
    console.log("Token Contract deployed to:" + tokenContract.address);

    const indexContractFactory = await ethers.getContractFactory("IndexContract"); // "IndexToken" matches import
    indexContract = await indexContractFactory.deploy(            tokenContract.address,
      [aWBTC, aWEth],
      [wBtcContractAddress, wEthContractAddress]);
    await indexContract.deployed();

    // console.log(tokenContract.deployTransaction);
    console.log("Index Contract deployed to:" + indexContract.address);

      // assign minter role
      const MINTER_ROLE = await tokenContract.MINTER_ROLE();
      const grantRoleTx = await tokenContract.grantRole(
          MINTER_ROLE,
          indexContract.address
      );
      await grantRoleTx.wait();
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});