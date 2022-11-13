import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { artifacts, ethers } from "hardhat";
import { IndexContract } from '../typechain-types/contracts/IndexContract.sol'; // import other contract for local deployment 
import { IndexToken } from '../typechain-types/contracts'; // import other contract for local deployment 
import { abi } from '../artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json';
import { Provider } from "@ethersproject/providers";

// const ERC20_Data = ERC20;

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

    // describe("When withdraw() is called in the IndexContract.sol", async () => {

    //     beforeEach(async () => {
    //         const acc1Fund = await indexContract.connect(acc1).receive_funds({ "value": ethers.utils.parseEther("10"), });
    //         acc1Fund.wait();
    //         const acc2Fund = await indexContract.connect(acc2).receive_funds({ "value": ethers.utils.parseEther("10"), });
    //         acc2Fund.wait();
    //         const acc1IndexTokenBal = await tokenContract.balanceOf(acc1.address);
    //         console.log(`User IndexToken Balance is: ${ethers.utils.formatEther(acc1IndexTokenBal)} Tokens`);
    //     })

    //     it("CalculateIndexTokensValue() - calculates the value of index token balance", async () => {
    //         // get index token balance of acc1 
    //         const acc1IndexTokenBal = await tokenContract.balanceOf(acc1.address);

    //         // initial eth balance of contract
    //         const indexTokensToWithdraw = acc1IndexTokenBal.div(2)
    //         await indexContract.calculateIndexTokensValue(indexTokensToWithdraw);

    //         // log token Value of user tokens
    //         const userValue = await indexContract.userTokenValue()
    //         console.log(userValue);

    //         // log total supply
    //         const totalSupply = await tokenContract.totalSupply();
    //         console.log(totalSupply);

    //         // token value in typescript 
    //         const indexValue = await indexContract.indexValue();

    //         // value typescript
    //         const userValueTs = (indexValue.div(totalSupply)).mul(indexTokensToWithdraw)

    // //         expect(userValue).to.eq(userValueTs);
    // //     })

    // })

    describe("When withdraw() is called in the IndexContract.sol", async () => {

        beforeEach(async () => {
            // account 1 funds
            const acc1Fund = await indexContract.connect(acc1).receive_funds({ "value": ethers.utils.parseEther("10"), });
            acc1Fund.wait();
            //acount 2 funds 
            const acc2Fund = await indexContract.connect(acc2).receive_funds({ "value": ethers.utils.parseEther("30"), });
            acc2Fund.wait();
            //rebalance index contract
            const rebalanceTx = await indexContract.balanceFund();
            rebalanceTx.wait();
        })

        it("CalculateIndexTokensValue() - calculates the value of index token balance", async () => {
            // get index token balance of acc1 
            const acc1IndexTokenBal = await tokenContract.balanceOf(acc1.address);
            console.log(`User IndexToken Balance is: ${ethers.utils.formatEther(acc1IndexTokenBal)} Tokens`);

            // withdraw 50 % of funds - i.e 5 eth
            const indexTokensToWithdraw = acc1IndexTokenBal.div(2)
            await (await indexContract.calculateIndexTokensValue(indexTokensToWithdraw)).wait();
            // log token Value of user tokens
            const userValue = await indexContract.withdrawalTokenValue();
            console.log(`Function User Funds Value: ${ethers.utils.formatEther(userValue)}`);

            // Alternative calcuation typescript
            // log total supply
            const totalSupply = await tokenContract.totalSupply();
            console.log(`Total Index Token Supply: ${totalSupply}`);

            // token value in typescript 
            const indexValue = await indexContract.indexValue();
            console.log(`Total Index Value: ${indexValue}`);


            // value typescript
            const userValueTs = (indexValue.mul(indexTokensToWithdraw)).div(totalSupply);
            console.log(`Typescript User Funds Vale: ${ethers.utils.formatEther(userValueTs)}`);

            expect(userValue).to.eq(userValueTs);
        })

        it("burns returned index tokens", async () => {
            const initialTokenSupplyBN = await tokenContract.totalSupply();
            const initialTokenSupply = ethers.utils.formatEther(initialTokenSupplyBN);
            const burnTx = await tokenContract.connect(acc1).burn(ethers.utils.parseEther("5"));
            burnTx.wait();
            const finalTokenSupplyBN = await tokenContract.totalSupply();
            const finalTokenSupply = ethers.utils.formatEther(finalTokenSupplyBN);
            expect(Number(finalTokenSupply)).to.eq(Number(initialTokenSupply)-5)
        })

        it("reverts attempts to withdraw too much eth", async () => {
            const initialAcc1TokenBalance = await tokenContract.balanceOf(acc1.address);
            const approvalTx = await tokenContract.connect(acc1).approve(indexContract.address, initialAcc1TokenBalance);
            approvalTx.wait();
            const withdrawTx = await indexContract.connect(acc1).withdraw((initialAcc1TokenBalance).add(0));
            withdrawTx.wait();
            console.log(withdrawTx);
            // expect(withdrawTx).to.throw(Error);
            
        })

        it("returns the correct amount of eth to the user", async () => {
            const initialAcc1EthBalance = deployer.getBalance(acc1.address);
            const initialAcc2EthBalance = deployer.getBalance(acc2.address);
            

        })

    })

});