import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { IndexContract } from '../typechain-types/contracts/IndexContract.sol'; // import other contract for local deployment 
import { IndexToken } from '../typechain-types/contracts'; // import other contract for local deployment 
import { abi as WethABI} from "../artifacts/contracts/IndexToken.sol/IndexToken.json";
import { BigNumber, Contract } from "ethers";
import { abi as ERC20ABI} from '../artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json';
import lendingPoolABI from "./ABIs/LendingPoolABI.json";

describe("testing all demo functionality", function () {
    let tokenContract: IndexToken;
    let indexContract: IndexContract;
    let deployer: SignerWithAddress;
    let acc1: SignerWithAddress;
    let acc2: SignerWithAddress;
    let aWBTC: string;
    let aWEth: string;
    let lendingPool: string;
    let wBtcContractAddress: string;
    let wEthContractAddress: string;
    let wethContract: Contract;
    let AWethContract: Contract;
    let AWbtcContract: Contract;
    let lendingPoolContract: Contract;


    beforeEach(async () => {
        [deployer, acc1, acc2] = await ethers.getSigners();
        wEthContractAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
        wBtcContractAddress = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";
        // hardcoded for now - atokens have ability to give underlying token 
        // contract address for extra robustness
        aWBTC = "0x9ff58f4fFB29fA2266Ab25e75e2A8b3503311656";
        aWEth = "0x030bA81f1c18d280636F32af80b9AAd02Cf0854e";
        lendingPool = "0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9";

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
            [aWBTC, aWEth],
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
        wethContract = new ethers.Contract(wEthContractAddress, WethABI, deployer);
        AWethContract = new ethers.Contract(aWEth, WethABI, deployer); //just use WethABI as only need balance of
        AWbtcContract = new ethers.Contract(aWBTC, ERC20ABI, deployer); //just use WethABI as only need balance of
        lendingPoolContract = new ethers.Contract(lendingPool, lendingPoolABI, deployer);
        console.log("setup complete");
    });

    describe("When user call receive_funds() the IndexContract.sol", async () => {

        beforeEach(async () => { })

        it("increases eth balance of the contract and non-reverting of the contract", async () => {

            const initialEthBalance = await ethers.provider.getBalance(indexContract.address);
            console.log(initialEthBalance);
            const fundAmount = String(Math.random() * 10);
            const fundAmountBN = ethers.utils.parseEther(fundAmount);
            const fundTx = await indexContract.connect(deployer).receive_funds({ "value": fundAmountBN });
            await fundTx.wait();
            const finalWethBalance = await wethContract.balanceOf(indexContract.address);
            console.log(`Final weth balance: ${finalWethBalance}`);
            expect(finalWethBalance).to.eq(fundAmountBN);
        });

        it("mints the correct number of tokens", async () => {
            const initialUserIndexTokenBalance = await tokenContract.balanceOf(acc1.address);
            const fundAmount = String(Math.random() * 10);
            const fundAmountBN = ethers.utils.parseEther(fundAmount);
            const tx = await indexContract.connect(acc1).receive_funds({ "value": fundAmountBN, });
            await tx.wait();
            const finalUserIndexTokenBalanceBN = await tokenContract.balanceOf(acc1.address);
            console.log(finalUserIndexTokenBalanceBN);
            const finalUserIndexTokenBalance = ethers.utils.formatEther(String(finalUserIndexTokenBalanceBN));
            console.log(`final user index token balance: ${finalUserIndexTokenBalance}`);
            const expectedBalance = initialUserIndexTokenBalance.add(fundAmountBN);
            expect(expectedBalance).to.eq(finalUserIndexTokenBalanceBN);
        });

    })

    describe("When user calls 'balanceFund()' with some eth in the contract", async () => {
        
        
        it("should create the index with equal values of aweth and awbtc", async () => {
            // fund contract
            const fundAmount = String(Math.random() * 100);
            const fundAmountBN = ethers.utils.parseEther(fundAmount);
            const tx = await indexContract.connect(acc1).receive_funds({ "value": fundAmountBN, });
            console.log("contract funded");
            await tx.wait();
            // call balance
            const balanceTx = await indexContract.connect(acc1).balanceFund();
            balanceTx.wait();
            console.log("balance has been called successfully");
            // return values of awbtc and aweth
            const aWbtcValue = await indexContract.aWbtcOnContractValue();
            console.log(`aWbtc value in index: ${aWbtcValue}`);
            const awethValue = await indexContract.aWethOnContract();
            console.log(`aWeth value in index: ${awethValue}`);
            const delta = awethValue.div(40) //2.5%
            expect(aWbtcValue).to.be.closeTo(awethValue, delta);
        })
    })

    describe("When a user withdraws", async () => {
        beforeEach(async () => { 

        })
        
        it("should allow them to deposit their index tokens", async () => {
            // same as previous 
            // fund contract
            const acc1InitialIndexTokenBalance = await tokenContract.balanceOf(acc1.address);
            console.log(`acc1 initial index token balance: ${acc1InitialIndexTokenBalance}`)
            const fundAmount = String(Math.random() * 100);
            const fundAmountBN = ethers.utils.parseEther(fundAmount);
            const tx = await indexContract.connect(acc1).receive_funds({ "value": fundAmountBN, });
            console.log("contract funded");
            await tx.wait();
            // call balance
            const balanceTx = await indexContract.connect(acc1).balanceFund();
            balanceTx.wait();
            // withdraw
            const removeTx = await indexContract.connect(acc1).withdraw(fundAmountBN);
            removeTx.wait();
            console.log("user withdrawn");
            const acc1FinalIndexTokenBalance = tokenContract.balanceOf(acc1.address);
            console.log(`acc1 new balance: ${acc1FinalIndexTokenBalance}`);
            expect(acc1FinalIndexTokenBalance).to.eq(0);
        })
            
    })
            
})
