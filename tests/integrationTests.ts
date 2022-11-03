import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { IndexContract } from '../typechain-types/contracts/IndexContract.sol'; // import other contract for local deployment 
import { IndexToken } from '../typechain-types/contracts'; // import other contract for local deployment 
import { Address } from "cluster";

describe("IndexContract Integration", function () {
    let tokenContract: IndexToken;
    let indexContract: IndexContract;
    let deployer: SignerWithAddress;
    let acc1: SignerWithAddress;
    let acc2: SignerWithAddress;
    let aBTC: String;
    let aEth: String;
    let wBtcContractAddress: String;
    let wEthContractAddress: String;

    beforeEach(async () => {
        [deployer, acc1, acc2] = await ethers.getSigners();
        wEthContractAddress = "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6";
        wBtcContractAddress = "0xda4a47edf8ab3c5eeeb537a97c5b66ea42f49cda";
        aBTC = "0xFC4B8ED459e00e5400be803A9BB3954234FD50e3";
        aEth = "0x3a3A65aAb0dd2A17E3F1947bA16138cd37d08c04";



        // get factories 
        const tokenContractFacory = await ethers.getContractFactory('IndexToken');
        const indexContractFactory = await ethers.getContractFactory('IndexContract');

        // deploy contract 
        /// token contract 
        tokenContract = await tokenContractFacory.deploy();
        await tokenContract.deployed();
        // console.log("tokenContract deployed!");

        /// deploy indexContract 
        indexContract = await indexContractFactory.deploy(
            tokenContract.address,
            [aBTC, aEth],
            [wBtcContractAddress, wEthContractAddress]
        );

        await indexContract.deployed();
        // console.log("indexContract deployed!");

        // assign minter role
        const MINTER_ROLE = await tokenContract.MINTER_ROLE();
        const grantRoleTx = await tokenContract.grantRole(
            MINTER_ROLE,
            indexContract.address
        );
        await grantRoleTx.wait();
        // console.log("Minter role granted!");
    });

    describe("When the createIndex() function is called", async () => {

        beforeEach(async () => {
            // fund contract from two wallets:
            const acc1Fund = await indexContract.connect(acc1).receive_funds({ "value": ethers.utils.parseEther("0.11"), });
            acc1Fund.wait();
            const acc2Fund = await indexContract.connect(acc1).receive_funds({ "value": ethers.utils.parseEther("1"), });
            acc2Fund.wait();
            console.log(`contract funded with: ${await ethers.provider.getBalance(indexContract.address)} ether`)
        })


        it("swaps half of the collected ETH to BTC", async () => {

            const initialEthBalance = await ethers.provider.getBalance(indexContract.address);
            console.log(initialEthBalance);

            const fundTx = await indexContract.connect(deployer).receive_funds({ "value": ethers.utils.parseEther("1") });
            await fundTx.wait();
            console.log(fundTx.hash);

            const finalEthBalance = await ethers.provider.getBalance(indexContract.address);
            expect(finalEthBalance).to.not.eq(initialEthBalance);
            console.log("Successfully funded contract");

        });

        // it("")
    });




})