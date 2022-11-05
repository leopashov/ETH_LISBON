import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract, Signer } from "ethers";
import { ethers } from "hardhat";
import { PromiseOrValue } from "../typechain-types/common";
import { abi as WethABI } from "../artifacts/contracts/IndexToken.sol/IndexToken.json"; //indexToken is ERC20

describe("Goerli connection", async () => {


    let accounts: SignerWithAddress[];
    let WethContract: Contract;

    beforeEach(async () => {
        // const provider = ethers.getDefaultProvider("goerli", options)
        accounts = await ethers.getSigners();
        const signer = accounts[0];
        const goerliWethTokenAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
        console.log(WethABI, typeof (WethABI));
        WethContract = new ethers.Contract(goerliWethTokenAddress, WethABI, signer);
    })

    describe("some description lol", async () => {

        it("should get the latest goerli block", async () => {

            const latestBlock = await ethers.provider.getBlock("latest");
            expect(latestBlock.number).to.be.above(7883340); // block number at time of writing test
        })

        it("should be able to call weth data", async () => {
            const callInfo = await WethContract.decimals()
            console.log(callInfo);
            expect(callInfo).to.eq(18);
        })
    })
})
