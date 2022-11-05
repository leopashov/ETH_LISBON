import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { IndexContract } from '../typechain-types/contracts/IndexContract.sol'; // import other contract for local deployment 
import { IndexToken } from '../typechain-types/contracts'; // import other contract for local deployment 


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
            // [atoken1.address, atoken2.address, atoken3.address],
            // [token1.address, token2.address, token3.address]
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


    describe("When user call receive_funds() the IndexContract.sol", async () => {

        beforeEach(async () => { })

        it("increases eth balance of the contract and non-reverting of the contract", async () => {

            const initialEthBalance = await ethers.provider.getBalance(indexContract.address);
            const fundTx = await indexContract.connect(deployer).receive_funds({ "value": ethers.utils.parseEther("1") });
            await fundTx.wait();
            const finalEthBalance = await ethers.provider.getBalance(indexContract.address);
            expect(finalEthBalance).to.not.eq(initialEthBalance);
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
            const finalUserIndexTokenBalanceBN = await tokenContract.balanceOf(acc1.address);
            // console.log(finalUserIndexTokenBalanceBN);
            // const finalUserIndexTokenBalance = ethers.utils.formatEther(String(finalUserIndexTokenBalanceBN));

            const expectedBalance = initialUserIndexTokenBalance.add(ethers.utils.parseEther("1"));
            expect(expectedBalance).to.eq(finalUserIndexTokenBalance);
        });


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
        it("indexValue by amount of eth received increases if multiple user fund receive_funds()", async () => {


            // prefund contract with some eth
            const initialFundAmount = (String(10 * Math.random()));
            const initialFundAmountBN = ethers.utils.parseEther(initialFundAmount);
            const initialFundTx = await indexContract.connect(acc1).receive_funds({ "value": initialFundAmountBN, });
            initialFundTx.wait();

            // execution logic 
            const initialIndexValue = await indexContract.indexValue();
            console.log(`initial index value ${initialIndexValue}`);

            // @xm3van: I think here a merge fucked something up S

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
                // it("keeps track of the total number of user deposits", async () => {
                //     // use token variables (supply) to test this rather than mappings/ variables.
                //     // remove corresponding mapping + variable from sc
                //     const initialDeposits = await indexContract.totalUserDeposits();
                //     console.log(`initial index value ${initialDeposits}`);
                //     const acc2Deposit = 10 * Math.random();
                //     const acc2DepositBN = ethers.utils.parseEther(String(acc2Deposit));
                //     console.log(`acc2 deposit (wei): ${acc2DepositBN}`);
                //     const tx = await indexContract.connect(acc2).receive_funds({ "value": acc2DepositBN, });
                //     await tx.wait();
                //     const finaltotalUserDeposits = await indexContract.totalUserDeposits();
                //     const expectedValue = initialDeposits.add(acc2DepositBN);
                //     console.log(`final deposits value: ${finaltotalUserDeposits}`);
                //     console.log(`expectedValue: ${expectedValue}`);
                //     expect(finaltotalUserDeposits).to.eq(expectedValue);
                // })
            })


            describe("calculateTokensToMint()", async () => {
                it("calculates correct value when pool value 0 ", () => {
                    throw new Error("Not implemented");
                });

                it("calculates correct value when pool value not 0  ", () => {
                    throw new Error("Not implemented");
                });



                describe("getCurrentTokens()", async () => {
                    it("Suggestion remove getCurrentTokens()", () => {
                        throw new Error("Not implemented");
                    });
                });

                describe("When 'removeLiqudity()' function is called", () => {


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

                describe("getIndexBalances()", async () => {

                    it("Unit testing required", () => {
                        throw new Error("Not implemented");
                    });
                });

                describe("calculatePoolValue()", async () => {

                    // Integration testing required! 
                    it("calculates correct value of pool assets", () => {
                        throw new Error("Not implemented");
                    });
                });

                describe("calculateTokenVaultValue()", async () => {

                    // Integration testing required! 
                    it("calculates correct value of a given pool assets", () => {
                        throw new Error("Not implemented");
                    });
                });

                describe("calculateTokenVaultValue()", async () => {

                    // Integration testing required! 
                    it("calculates correct value of a given pool assets", () => {
                        throw new Error("Not implemented");
                    });
                });

                describe("calculateVaultTokenPriceInEth()", async () => {

                    // Integration testing required! 
                    it("calculates correct value of a given pool assets", () => {
                        throw new Error("Not implemented");
                    });
                });

                describe("swapEthForToken()", async () => {

                    // Integration testing required! 
                    it("calculates correct value of a given pool assets", () => {
                        throw new Error("Not implemented");
                    });
                });

                describe("balanceFund()", async () => {
                    //@xm3van: Integration testing needed! Unit testing possible
                    //@xm3van: double check test - seems like they can be broken down
                    // into further functions 

                    this.beforeEach(async () => {

                    })

                    it("calculates vault token price in eth", () => {
                        // expect(indexContract.calculateVaultTokenPriceInEth(atoken1));
                        throw new Error("not implemented");

                    })

                    it("has initial vault token dummy values", () => {
                        // expect(indexContract._vaultTokens).to.not.eq(null);
                        throw new Error("not implemented");

                    })

                    it("updates token proportions", () => {
                        throw new Error("not implemented");
                    })

                    it("recovers the right amount of ERC20 tokens", () => {
                        throw new Error("Not implemented");
                    });

                    it("updates the owner account correctly", () => {
                        throw new Error("Not implemented");
                    });

                });


                describe("unstakeAndSell()", async () => {

                    // Integration testing required!
                    it("calculates correct value of a given pool assets", () => {
                        throw new Error("Not implemented");
                    });
                });

                describe("updateTokenProportionsAndReturnMaxLoc()", async () => {

                    // Integration testing required!
                    it("calculates correct value of a given pool assets", () => {
                        throw new Error("Not implemented");
                    });
                });

            });

            // @xm3van: integragte below or delete

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

            it("again mints the correct number of tokens", async () => {
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
