// Gets deployed to : 0x90c84237fDdf091b1E63f369AF122EB46000bc70 on hardhat mainnet fork
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
// connect just using ethers nicer; fewer dependencies etc
// hardhat has lots of baggage
// connect to testnet from 1:00:00
import * as dotenv from "dotenv";
import { errorMonitor } from "events";
import { IndexToken } from "../typechain-types/contracts";
import { PromiseOrValue } from "../typechain-types/common";
dotenv.config();


async function main() {
    let tokenContract: IndexToken;
    let accounts: SignerWithAddress[] | { address: PromiseOrValue<string>; }[];


    accounts = await ethers.getSigners();
    const tokenFactory = await ethers.getContractFactory("IndexToken"); // "IndexToken" matches import
    tokenContract = await tokenFactory.deploy();
    await tokenContract.deployed();

    console.log(tokenContract.deployTransaction);
    console.log("Contract deployed to:" + tokenContract.address)
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});