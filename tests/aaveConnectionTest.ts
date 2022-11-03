import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Signer } from "ethers";
import { ethers } from "hardhat";
import { PromiseOrValue } from "../typechain-types/common";
import * as WethABI from "./WethABI.json";

describe("aave connection", async() => {


    let accounts: SignerWithAddress[];

    beforeEach(async() => {
        // const provider = ethers.getDefaultProvider("goerli", options)
        accounts = await ethers.getSigners();
        const signer = accounts[0];
        const goerliWethTokenAddress = '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6';
        const WethContract = new ethers.Contract(goerliWethTokenAddress, WethABI, signer);
    })

    describe("some description lol", async() => { 
        // const goerliWethTokenAddress = '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6';
        // const WethContract = new ethers.Contract(goerliWethTokenAddress, WethABI, signer);

        it("should get the latest goerli block", async() => {
            
            Signer.getBlock();
        })
        
        it("should be able to weth data", async() => {
            const callInfo = await WethContract.decimals()
            console.log(callInfo);
            expect(callInfo).to.eq(18);
        })
    })
})
