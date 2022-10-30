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
        // @xm3van: what does this line do?

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
            [atoken1.address, atoken2.address, atoken3.address]
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
            expect(error).to.be.an('error');

            // ref.: https://www.chaijs.com/api/bdd/

            //NOTE: function behaves as expected but I cannot find the right was to make 
            // the expect function work
        });

        it("mints the correct number of tokens", async () => {
            const initialUserIndexTokenBalance = await tokenContract.balanceOf(acc1.address);
            const tx = await indexContract.connect(acc1).receive_funds({ "value": ethers.utils.parseEther("0.11"), });
            await tx.wait();
            const finalUserIndexTokenBalanceBN = await tokenContract.balanceOf(acc1.address);
            console.log(finalUserIndexTokenBalanceBN);
            const finalUserIndexTokenBalance = ethers.utils.formatEther(String(finalUserIndexTokenBalanceBN));
            const expectedBalance = initialUserIndexTokenBalance.add(ethers.utils.parseEther("1"));
            expect(expectedBalance).to.eq(finalUserIndexTokenBalanceBN);
        });
        // @xm3van:  it technically already covered in the first function, thus if we wanted to we can delete this 
        // here. 


        describe("When update supply function is called", async () => {

            it("we expect the total supply to increase", async () => {

                // check inital token supply
                const currentTokenSupplyInitial = await indexContract.currentTokenSupply();
                console.log(`The initial token supply is ${currentTokenSupplyInitial}`);

                // mint token 
                const fundTx = await indexContract.connect(deployer).receive_funds({ "value": ethers.utils.parseEther("1") });
                await fundTx.wait();
                console.log(`Tx-hash of mint: ${fundTx.hash}`);

                // call update functon
                const updateSupplyTx = await indexContract.updateTotalSupply();
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
                console.log(`initial fund amount (wei): ${initialFundAmountBN}`);
            });

            it("increases indexValue by amount of eth received", async () => {
                const initialIndexValue = await indexContract.indexValue();
                console.log(`initial index value ${initialIndexValue}`);
                const acc2Deposit = 10 * Math.random();
                const acc2DepositBN = ethers.utils.parseEther(String(acc2Deposit));
                console.log(`acc2 deposit (wei): ${acc2DepositBN}`);
                const tx = await indexContract.connect(acc2).receive_funds({ "value": acc2DepositBN, });
                await tx.wait();
                const finalIndexValue = await indexContract.indexValue();
                const expectedValue = initialIndexValue.add(acc2DepositBN);
                console.log(`final index value: ${finalIndexValue}`);
                console.log(`expectedValue: ${expectedValue}`);
                expect(finalIndexValue).to.eq(expectedValue);
                // not sure about decimals (ie weivs eth) here
                // A.: I believe best practice is to denominate everything in wei - let's be consistent 
            })

            it("mints the correct number of tokens", async () => {
                const initialUserIndexTokenBalance = await tokenContract.balanceOf(acc2.address);
                // use other account aswell
                const acc2Deposit = 10 * Math.random();
                console.log(acc2Deposit);
                const tx = await indexContract.connect(acc2).receive_funds({ "value": ethers.utils.parseEther(String(acc2Deposit)), });
                await tx.wait();
                const finalUserIndexTokenBalance = await tokenContract.balanceOf(acc2.address);
                // const finalUserIndexTokenBalance = ethers.utils.formatEther(String(finalUserIndexTokenBalanceBN));
                console.log(finalUserIndexTokenBalance);
                const expectedBalance = initialUserIndexTokenBalance.add(ethers.utils.parseEther("1"));
                expect(expectedBalance).to.eq(finalUserIndexTokenBalance);
            });

            describe("when 'Balance Fund' function is called", () => {
                this.beforeEach(async () => {

                })

                it("calculates vault token price in eth", () => {
                    expect(indexContract.calculateVaultTokenPriceInEth(atoken1));
                })

                it("has initial vault token dummy values", () => {
                    expect(indexContract._vaultTokens).to.not.eq(null);
                })

                it("updates token proportions", () => {
                    throw new Error("not implemented");
                })
            })
        });

        it("increases indexValue by amount of eth received", async () => {
            const initialIndexValue = await indexContract.indexValue();
            console.log(`initial index value ${initialIndexValue}`);
            const acc2Deposit = 10 * Math.random();
            const acc2DepositBN = ethers.utils.parseUnits(String(acc2Deposit));
            console.log(`acc2 deposit (wei): ${acc2DepositBN}`);
            const tx = await indexContract.connect(acc2).receive_funds({ "value": acc2DepositBN, });
            await tx.wait();
            const finalIndexValue = await indexContract.indexValue();
            const expectedValue = initialIndexValue.add(acc2DepositBN);
            console.log(`final index value: ${finalIndexValue}`);
            console.log(`expectedValue: ${expectedValue}`);
            expect(finalIndexValue).to.eq(expectedValue);
            // not sure about decimals (ie weivs eth) here
        })

        it("mints the correct number of tokens", async () => {
            const initialUserIndexTokenBalance = await tokenContract.balanceOf(acc2.address);
            const acc2Deposit = 10 * Math.random();
            const acc2DepositBN = ethers.utils.parseEther(String(acc2Deposit));
            console.log(acc2DepositBN);
            const tx = await indexContract.connect(acc2).receive_funds({ "value": acc2DepositBN, });
            await tx.wait();
            const finalUserIndexTokenBalance = await tokenContract.balanceOf(acc2.address);
            console.log(finalUserIndexTokenBalance);
            const finalIndexValue = await indexContract.indexValue();
            const finalTotalTokens = await tokenContract.totalSupply();
            // calculate expected index token balance by getting proportion of this user's deposits compared to all deposits and multiplying by total index tokens
            const expectedBalance = ((acc2DepositBN).mul(finalTotalTokens)).div(finalIndexValue);
            expect(expectedBalance).to.eq(finalUserIndexTokenBalance);
        });

        //     it("recovers the right amount of ERC20 tokens", () => {
        //         throw new Error("Not implemented");
        //     });

        //     it("updates the owner account correctly", () => {
        //         throw new Error("Not implemented");
        //     });

        // });
    })
})
