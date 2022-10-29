import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { IndexToken } from "../typechain-types";
import { PromiseOrValue } from "../typechain-types/common";

// to run test: 'yarn hardhat test ./tests/TokenTest.ts'

describe("TokenContract", async () => {
    let tokenContract: IndexToken;
    let accounts: SignerWithAddress[] | { address: PromiseOrValue<string>; }[];

    beforeEach(async () => {
        accounts = await ethers.getSigners();
        const tokenFactory = await ethers.getContractFactory("IndexToken"); // "IndexToken" matches import
        tokenContract = await tokenFactory.deploy();
        await tokenContract.deployed();
        console.log(tokenContract);
    })

    it("should have an address when deployed", async() => {
        expect(tokenContract.address).to.not.eq(null);
    })

})