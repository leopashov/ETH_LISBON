import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { IndexContract } from '../typechain-types/contracts/IndexContract.sol'; // import other contract for local deployment 
import { IndexToken } from '../typechain-types/contracts'; // import other contract for local deployment 
import { abi as WethABI} from "../artifacts/contracts/IndexToken.sol/IndexToken.json";
import { Contract } from "ethers";
import { abi as ERC20ABI} from '../artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json';

describe("IndexContract Integration", function () {
    let tokenContract: IndexToken;
    let indexContract: IndexContract;
    let deployer: SignerWithAddress;
    let acc1: SignerWithAddress;
    let acc2: SignerWithAddress;
    let aWBTC: string;
    let aWEth: string;
    let wBtcContractAddress: string;
    let wEthContractAddress: string;
    let wethContract: Contract;
    let AWethContract: Contract;
    let AWbtcContract: Contract;

    beforeEach(async () => {
        [deployer, acc1, acc2] = await ethers.getSigners();
        wEthContractAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
        wBtcContractAddress = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";
        // hardcoded for now - atokens have ability to give underlying token 
        // contract address for extra robustness
        aWBTC = "0xFC4B8ED459e00e5400be803A9BB3954234FD50e3";
        aWEth = "0x030bA81f1c18d280636F32af80b9AAd02Cf0854e";

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
    });

    describe("When the contract is funded by > 1 account", async () => {
        beforeEach(async () => {
            // fund contract from two wallets:
            const acc1Fund = await indexContract.connect(acc1).receive_funds({ "value": ethers.utils.parseEther("0.11"), });
            acc1Fund.wait();
            console.log(`contract funded with: ${await ethers.provider.getBalance(indexContract.address)} wei`)
        })
        it("correctly updates index value", async() =>{
            const acc2Fund = await indexContract.connect(acc2).receive_funds({ "value": ethers.utils.parseEther("1"), });
            acc2Fund.wait();
            const fundedAmount = ethers.utils.parseEther("1.11");
            const indexValue = await indexContract.indexValue();
            console.log(`indexValue: ${indexValue}`);
            
            expect(ethers.BigNumber.from(indexValue)).to.eq(fundedAmount);
        });

        it("again mints the correct number of tokens",async () => {
            // needs looking at - both SC and here
            const acc2Deposit = 10 * Math.random();
            const acc2DepositBN = ethers.utils.parseEther(String(acc2Deposit));
            console.log(`account 2 planning to deposit: ${acc2DepositBN}`);
            const currentTotalTokens = await tokenContract.totalSupply();
            console.log(`total tokens before new deposit: ${currentTotalTokens}`)
            const tx = await indexContract.connect(acc2).receive_funds({ "value": acc2DepositBN, });
            await tx.wait();
            console.log(`acc2 has funded contract with ${acc2DepositBN} wei`);
            const finalUserIndexTokenBalance = await tokenContract.balanceOf(acc2.address);
            console.log(`account 2 index token balance: ${finalUserIndexTokenBalance}`);
            const finalTotalTokens = await tokenContract.totalSupply();
            const totalUserDeposits = await indexContract.totalUserDeposits();
            console.log(`total user deposits: ${totalUserDeposits}`);
            // calculate expected index token balance by getting proportion of this user's deposits compared to all deposits and multiplying by total index tokens
            const expectedBalance = ((acc2DepositBN).mul(finalTotalTokens)).div(totalUserDeposits);
            expect(expectedBalance).to.eq(finalUserIndexTokenBalance);
        });
        
    })
    
    
    
    describe("When the balanceFund() function is called", async () => {

        beforeEach(async () => {
            // fund contract from two wallets:
            const acc1Fund = await indexContract.connect(acc1).receive_funds({ "value": ethers.utils.parseEther("0.11"), });
            acc1Fund.wait();
            const acc2Fund = await indexContract.connect(acc2).receive_funds({ "value": ethers.utils.parseEther("1"), });
            acc2Fund.wait();
            console.log(`contract funded with: ${await ethers.provider.getBalance(indexContract.address)} ether`)
            wethContract = new ethers.Contract(wEthContractAddress, WethABI, deployer);
            AWethContract = new ethers.Contract(aWEth, WethABI, deployer); //just use WethABI as only need balance of
            AWbtcContract = new ethers.Contract(aWBTC, ERC20ABI, deployer); //just use WethABI as only need balance of
        })


        it("swaps half of the collected ETH to BTC", async () => {
            const initialEthOnContract = await ethers.provider.getBalance(indexContract.address);
            const halfInitial = initialEthOnContract.div(2);
            console.log(`half initial: ${halfInitial}`);
            const tx = await indexContract.connect(acc2).balanceFund();
            console.log(`tx hash: ${tx.hash}`);
            tx.wait();
            // const txGasLimit = tx.gasLimit;
            // const txGasPrice = tx.gasPrice;
            // const gasSpent = txGasLimit.mul(ethers.BigNumber.from(txGasPrice));
            // console.log(`gas spent: ${gasSpent}`);
            const finalWethOnContract = await wethContract.balanceOf(indexContract.address);
            console.log(`final weth on contract: ${finalWethOnContract}`);
            expect(finalWethOnContract).to.eq(halfInitial);
            // wont pass now as have implmented aave functionality but did work before.
        });

        it("deposits WETH to aave, receiving awethtokens", async () => {
            const initialEthOnContract = await ethers.provider.getBalance(indexContract.address);
            const halfInitial = initialEthOnContract.div(2);
            console.log(`half initial: ${halfInitial}`)
            const initialAWethBalance = await AWethContract.balanceOf(indexContract.address);
            console.log(`inital aweth balance: ${initialAWethBalance}`);
            // const initialAWbtcBalance = AWbtcContract.balanceOf(indexContract.address);
            const tx = await indexContract.connect(acc2).balanceFund();
            tx.wait();
            const finalAWethBalance = await AWethContract.balanceOf(indexContract.address);
            console.log(`final aweth balance: ${finalAWethBalance}`);
            expect(halfInitial).to.eq(finalAWethBalance.sub(initialAWethBalance));
        });

        it("deposits WBTC to aave, receiving awbtctokens", async () => {
            const wbtcPriceHex = await indexContract.getWbtcPrice();
            const wbtcPriceBN = wbtcPriceHex.toString();
            const initialEthOnContract = await ethers.provider.getBalance(indexContract.address);
            const halfInitial = initialEthOnContract.div(2);
            console.log(`half initial: ${halfInitial}`)
            //const initialAWbtcBalanceValue = await indexContract.getDepositedValue(AWbtcContract.address);
            const initialAWbtcBalance = await AWbtcContract.balanceOf(indexContract.address);
            const initialAWbtcBalanceValue = wbtcPriceHex.mul(initialAWbtcBalance);
            console.log(`inital awbtc balance: ${initialAWbtcBalanceValue}`);
            // const initialAWbtcBalance = AWbtcContract.balanceOf(indexContract.address);
            const tx = await indexContract.connect(acc2).balanceFund();
            tx.wait();
            const AWbtcDecimals = await AWbtcContract.decimals();
            console.log(`awbtc decimals: ${AWbtcDecimals}`);
            const finalAWbtcBalance = await AWbtcContract.balanceOf(indexContract.address);
            console.log(`final awbtc balance: ${finalAWbtcBalance}`);
            const finalAWbtcBalanceValue = wbtcPriceHex.mul(finalAWbtcBalance);
            console.log(`final awbtc balance value: ${finalAWbtcBalanceValue}`);
            expect(halfInitial).to.eq(finalAWbtcBalanceValue.sub(initialAWbtcBalanceValue));
        })
    });

    describe("check uniswap functionality", () => {
        
        it("calculates minimum amount out (getAmountOutMin)", async() => {
            expect(0).to.eq(0);
        })
    })

    describe("get wbtc price in terms of eth", () => {

        it("retreives the price of wbtc denominated in eth", async () => {
            const wbtcPriceHex = await indexContract.getWbtcPrice();
            const wbtcPriceBN = wbtcPriceHex.toString();
            console.log(`wbtcPriceBN ${String(wbtcPriceBN)}`);
            const wbtcPrice = ethers.utils.formatEther(String(wbtcPriceBN));
            console.log(wbtcPrice);
            //expect price to be ~12.98
        })
    })




})