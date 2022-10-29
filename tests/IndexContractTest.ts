import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { IndexContract } from "../typechain-types";
import { PromiseOrValue } from "../typechain-types/common";

describe("IndexContract", function() {
    let indexContract: IndexContract;
    let accounts: SignerWithAddress[] | { address: PromiseOrValue<string>; }[];
})