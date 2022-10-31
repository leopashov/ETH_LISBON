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
            expect(error).to.be.an('error');

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
        // @xm3van:  it technically already covered in the first function, thus if we wanted to we can delete this 
        // here. 
        // @leo: it is similar but this one check index token balances, whereas other only considers eth, so this does have a bit more functionality i think
        // also it works so much aswell keep it lol
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
            // remove corresponding mapping + variable from sc
            const initialDeposits = await indexContract.totalUserDeposits();
            console.log(`initial index value ${initialDeposits}`);
            const acc2Deposit = 10 * Math.random();
            const acc2DepositBN = ethers.utils.parseEther(String(acc2Deposit));
            console.log(`acc2 deposit (wei): ${acc2DepositBN}`);
            const tx = await indexContract.connect(acc2).receive_funds({ "value": acc2DepositBN, });
            await tx.wait();
            const finaltotalUserDeposits = await indexContract.totalUserDeposits();
            const expectedValue = initialDeposits.add(acc2DepositBN);
            console.log(`final deposits value: ${finaltotalUserDeposits}`);
            console.log(`expectedValue: ${expectedValue}`);
            expect(finaltotalUserDeposits).to.eq(expectedValue);
        })

        it("keeps track of individual user deposits", async () =>{
            const acc2Deposit = 10 * Math.random();
            const acc2DepositBN = ethers.utils.parseEther(String(acc2Deposit));
            const tx = await indexContract.connect(acc2).receive_funds({ "value": acc2DepositBN, });
            await tx.wait();
            const mappingValue = await indexContract.addressToAmountFunded(acc2.address);
            expect(mappingValue).to.eq(acc2DepositBN);
        })

        it("again mints the correct number of tokens",async () => {
            // needs looking at - both SC and here
            const acc2Deposit = 10 * Math.random();
            const acc2DepositBN = ethers.utils.parseEther(String(acc2Deposit));
            console.log(acc2DepositBN);
            const tx = await indexContract.connect(acc2).receive_funds({ "value": acc2DepositBN, });
            await tx.wait();
            const finalUserIndexTokenBalance = await tokenContract.balanceOf(acc2.address);
            console.log(finalUserIndexTokenBalance);
            const totalUserDeposits = await indexContract.totalUserDeposits();
            const finalTotalTokens = await tokenContract.totalSupply();
            // calculate expected index token balance by getting proportion of this user's deposits compared to all deposits and multiplying by total index tokens
            const expectedBalance = ((acc2DepositBN).mul(finalTotalTokens)).div(totalUserDeposits);
            expect(expectedBalance).to.eq(finalUserIndexTokenBalance);
        });
    });

    describe("when 'Balance Fund' function is called and indexvalue = 0", () => {
        // this will require integration testing as it requires functionality from other protocols eg uniswap - see google doc for references
        beforeEach(async () => {

        })

        it("updates token proportions returns 4", async () => {
            const getInfoTx = await indexContract.updateTokenProportionsAndReturnMaxLoc();
            getInfoTx.wait();
            console.log(Number(getInfoTx.data));
            expect(getInfoTx).to.eq(4);
        })

        it("calculates vault token price in eth", () => {
            // expect(indexContract.calculateVaultTokenPriceInEth(atoken1));
        })

        it("has initial vault token dummy values", () => {
            //expect(indexContract._vaultTokens).to.not.eq(null);
        })


    });

    describe("when a user withdraws from the index", () => {

        beforeEach(async () => {
            // user needs funds within the contract
            const initialFundAmount = (String(10 * Math.random()));
            const initialFundAmountBN = ethers.utils.parseEther(initialFundAmount);
            const initialFundTx = await indexContract.connect(acc1).receive_funds({ "value": initialFundAmountBN, });
            initialFundTx.wait();
            console.log(`initial fund amount (wei): ${initialFundAmountBN}`);
            const userIndexTokensHoldingsOnInit = await tokenContract.balanceOf(acc1.address);
            console.log(`initial index token holdings (wei?): ${userIndexTokensHoldingsOnInit}`);
            const changeAllowance = await tokenContract.connect(acc1).approve(indexContract.address, userIndexTokensHoldingsOnInit);
            changeAllowance.wait();
            const currentAllowance = await tokenContract.allowance(acc1.address, indexContract.address);
            console.log(`tokens allowance changed, value: ${currentAllowance}`);
        });

        it("allows the user to send back index tokens", async () => {
            const initialAcc1TokenBalance = await tokenContract.balanceOf(acc1.address);
            console.log(initialAcc1TokenBalance);
            // remove liquidity
            const removeTx = await indexContract.connect(acc1).returnIndexTokens(ethers.utils.parseEther("1"));
            removeTx.wait();
            const finalAcc1TokenBalance = await tokenContract.balanceOf(acc1.address);
            expect(finalAcc1TokenBalance).to.eq(0);
        })

        it("burns index tokens", async () => {
            // this function should not be public but have put it as public for now to test
            const removeTx = await indexContract.connect(acc1).returnIndexTokens(ethers.utils.parseEther("1"));
            removeTx.wait();
            const burnTx = await indexContract.connect(acc1).burnIndexTokens(ethers.utils.parseEther("1"));
            burnTx.wait();
            expect(await tokenContract.balanceOf(indexContract.address)).to.eq(0);
        })

        it("recalculates the underlying token proportions within the index", () => {
            throw new Error("Integration test");
        })

        it("removes liquidity from the appropriate (overbalanced) position", () => {
            throw new Error("Integration test");
        })

        it("sends eth back from the smart contract", async () => {
            const initialContractEth = await ethers.provider.getBalance(indexContract.address);
            const initialAccountEth = await ethers.provider.getBalance(acc1.address);
            const sendTx = await indexContract.connect(acc1).returnEth("5");
            sendTx.wait();
            const gasPrice = sendTx.gasPrice;
            const gasLimit = sendTx.gasLimit;
            const gasCost = gasPrice.mul(gasLimit);
            const finalContractEth = await ethers.provider.getBalance(indexContract.address);
            const finalAccountEth = await ethers.provider.getBalance(acc1.address);
            expect(finalAccountEth).to.eq(initialAccountEth.add(5).sub(gasCost));
        })
    })     
    
})
