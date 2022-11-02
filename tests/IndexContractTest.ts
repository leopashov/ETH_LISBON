import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { IndexContract } from '../typechain-types/contracts/IndexContract.sol'; // import other contract for local deployment 
import { IndexToken } from '../typechain-types/contracts'; // import other contract for local deployment 
import { tokenToString } from "typescript";


describe("IndexContract", function () {
    let tokenContract: IndexToken;
    let indexContract: IndexContract;
    let deployer: SignerWithAddress;
    let acc1: SignerWithAddress;
    let acc2: SignerWithAddress;
    let token1: SignerWithAddress;
    let token2: SignerWithAddress;
    let token3: SignerWithAddress;
    let atoken1: SignerWithAddress;
    let atoken2: SignerWithAddress;
    let atoken3: SignerWithAddress;

    beforeEach(async () => {
        [deployer, acc1, acc2, token1, token2, token3, atoken1, atoken2, atoken3] = await ethers.getSigners();

        // get contract  
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
            [atoken1.address, atoken2.address, atoken3.address],
            [token1.address, token2.address, token3.address]
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


    describe("When the first user funds the IndexContract.sol", async () => {

        it("increases in eth balance of the contract and non-reverting of the contract", async () => {

            const initialEthBalance = await ethers.provider.getBalance(indexContract.address);
            console.log(initialEthBalance);

            const fundTx = await indexContract.connect(deployer).receive_funds({ "value": ethers.utils.parseEther("1") });
            await fundTx.wait();
            console.log(fundTx.hash);

            const finalEthBalance = await ethers.provider.getBalance(indexContract.address);
            expect(finalEthBalance).to.not.eq(initialEthBalance);
            console.log("Successfully funded contract");

        });

        it("transaction reversion for funding below 0.1 eth", async () => {
            var error = await indexContract.connect(acc1).receive_funds({ "value": ethers.utils.parseEther("0.01"), });
            expect(error).to.be.an('Error');

            // ref.: https://www.chaijs.com/api/bdd/

            //NOTE: function behaves as expected but I cannot find the right was to make 
            // the expect function work
        });

        it("mints the correct number of tokens", async () => {
            const initialUserIndexTokenBalance = await tokenContract.balanceOf(acc1.address);
            const tx = await indexContract.connect(acc1).receive_funds({ "value": ethers.utils.parseEther("0.11"), });
            await tx.wait();
            const finalUserIndexTokenBalance = await tokenContract.balanceOf(acc1.address);
            console.log(finalUserIndexTokenBalance);
            const expectedBalance = initialUserIndexTokenBalance.add(ethers.utils.parseEther("1"));
            expect(expectedBalance).to.eq(finalUserIndexTokenBalance);
        });
    })


    describe("When update supply function is called", async () => {

        it("we expect the total supply to increase", async () => { // @Leo - not really - calling 'update supply' does not increase the supply of index tokens. The supply is increased by 
            // sending eth to the contract 

            // check inital token supply
            const currentTokenSupplyInitial = await tokenContract.totalSupply();
            console.log(`The initial token supply is ${currentTokenSupplyInitial}`);

            // mint token 
            const fundTx = await indexContract.connect(deployer).receive_funds({ "value": ethers.utils.parseEther("1") });
            await fundTx.wait();
            console.log(`Tx-hash of mint: ${fundTx.hash}`);

            // call update functon
            const updateSupplyTx = await indexContract.updateTotalSupply(); // @leo = seems we are testing a function that doesnt actually exist?
            updateSupplyTx.wait();
            console.log(`Tx-hash of update supply: ${updateSupplyTx.hash}`);

            // check final balance
            // check inital token supply
            const currentTokenSupplyFinal = await indexContract.currentTokenSupply();
            console.log(`The initial token supply is ${currentTokenSupplyFinal}`);
            expect(currentTokenSupplyInitial).to.not.eq(currentTokenSupplyFinal);
        });

    })


    describe("When more users fund the IndexContract.sol", async () => {

        beforeEach(async () => {
            // prefund contract with some eth
            const initialFundAmount = (String(10 * Math.random()));
            const initialFundAmountBN = ethers.utils.parseEther(initialFundAmount);
            const initialFundTx = await indexContract.connect(acc1).receive_funds({ "value": initialFundAmountBN, });
            initialFundTx.wait();
            console.log(`initial fund amount (wei): ${initialFundAmountBN}`);
        });

        it("keeps track of the total number of user deposits", async () => {
            // use token variables (supply) to test this rather than mappings/ variables.
            const initialDeposits = await tokenContract.totalSupply();
            console.log(`initial index value ${initialDeposits}`);
            // deposit using account 2
            const acc2Deposit = 10 * Math.random();
            const acc2DepositBN = ethers.utils.parseEther(String(acc2Deposit));
            console.log(`acc2 deposit (wei): ${acc2DepositBN}`);
            const tx = await indexContract.connect(acc2).receive_funds({ "value": acc2DepositBN, });
            await tx.wait();
            const finaltotalUserDeposits = await tokenContract.totalSupply();
            const expectedValue = initialDeposits.add(acc2DepositBN);
            console.log(`final deposits value: ${finaltotalUserDeposits}`);
            console.log(`expectedValue: ${expectedValue}`);
            expect(finaltotalUserDeposits).to.eq(expectedValue);
        })


        it("keeps track of individual user deposits", async () => {
            const acc2Deposit = 10 * Math.random();
            const acc2DepositBN = ethers.utils.parseEther(String(acc2Deposit));
            const tx = await indexContract.connect(acc2).receive_funds({ "value": acc2DepositBN, });
            await tx.wait();
            const mappingValue = await indexContract.addressToAmountFunded(acc2.address);
            expect(mappingValue).to.eq(acc2DepositBN);
        })

    // describe("when 'Balance Fund' function is called", () => {
    //     this.beforeEach(async () => {

        it("again mints the correct number of tokens",async () => {
            // needs looking at - both SC and here
            const acc2Deposit = 10 * Math.random();
            const acc2DepositBN = ethers.utils.parseEther(String(acc2Deposit));
            console.log(`account 2 deposits: ${acc2DepositBN}`);
            const totalUserDeposits = await indexContract.totalUserDeposits();
            console.log(`total user deposits: ${totalUserDeposits}`)
            const finalTotalTokens = await tokenContract.totalSupply();
            console.log(`total tokens: ${finalTotalTokens}`)
            const tx = await indexContract.connect(acc2).receive_funds({ "value": acc2DepositBN, });
            await tx.wait();
            const finalUserIndexTokenBalance = await tokenContract.balanceOf(acc2.address);
            console.log(finalUserIndexTokenBalance);
            // calculate expected index token balance by getting proportion of this user's deposits compared to all deposits and multiplying by total index tokens
            const expectedBalance = ((acc2DepositBN).mul(finalTotalTokens)).div(totalUserDeposits);
            expect(expectedBalance).to.eq(finalUserIndexTokenBalance);
        });
    });

    //     it("calculates vault token price in eth", () => {
    //         expect(indexContract.calculateVaultTokenPriceInEth(atoken1));
    //     })

    //     it("has initial vault token dummy values", () => {
    //         expect(indexContract._vaultTokens).to.not.eq(null);
    //     })

    //     it("updates token proportions", () => {
    //         throw new Error("not implemented");
    //     })
    // });

    describe("When 'removeLiqudity' function is called", () => {


        it("total token supply will reduce", async () => {
            // initial token supply 
            const initalTokenSupply = await tokenContract.totalSupply();

            // mint token
            const acc1Deposit = 10 * (Math.random() + 0.1);
            const fundTx = await indexContract.connect(acc1).receive_funds({ "value": ethers.utils.parseEther(String(acc1Deposit)) });
            await fundTx.wait();

            // temporaryTokenSupply 
            const temporaryTokenSupply = await tokenContract.totalSupply();


            // remove liquidity
            indexContract.removeLiquidity(ethers.utils.parseEther(String(acc1Deposit)))

            // capture final tokenSupply
            const finalTokenSupply = await tokenContract.totalSupply();

            expect(initalTokenSupply).to.eq(finalTokenSupply);
            expect(initalTokenSupply).to.not.eq(temporaryTokenSupply);
        })
    });

        it("recovers the right amount of ERC20 tokens", () => {
            throw new Error("Not implemented");
        });

        it("updates the owner account correctly", () => {
            throw new Error("Not implemented");
        });


    });
