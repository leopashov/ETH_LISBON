import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { IndexContract } from '../typechain-types/contracts/IndexContract.sol'; // import other contract for local deployment 
import { IndexToken } from '../typechain-types/contracts'; // import other contract for local deployment 
import { abi } from '../artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json';
import { Address } from "cluster";
import { BigNumber } from "ethers";

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
        // hardcoded for now - atokens have ability to give underlying token 
        // contract address for extra robustness
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

    describe("When the contract is funded by > 1 account", async () => {
        beforeEach(async () => {
            // fund contract from two wallets:
            const acc1Fund = await indexContract.connect(acc1).receive_funds({ "value": ethers.utils.parseEther("0.11"), });
            acc1Fund.wait();
            console.log(`contract funded with: ${await ethers.provider.getBalance(indexContract.address)} wei`)
        })
        it("correctly updates index value", async () => {
            const acc2Fund = await indexContract.connect(acc2).receive_funds({ "value": ethers.utils.parseEther("1"), });
            acc2Fund.wait();
            const fundedAmount = ethers.utils.parseEther("1.11");
            const indexValue = await indexContract.indexValue();
            console.log(`indexValue: ${indexValue}`);

            expect(ethers.BigNumber.from(indexValue)).to.eq(fundedAmount);
        });

        it("again mints the correct number of tokens", async () => {
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


    describe("When the createIndex() function is called", async () => {

        beforeEach(async () => {
            // fund contract from two wallets:
            const acc1Fund = await indexContract.connect(acc1).receive_funds({ "value": ethers.utils.parseEther("0.11"), });
            acc1Fund.wait();
            const acc2Fund = await indexContract.connect(acc2).receive_funds({ "value": ethers.utils.parseEther("1"), });
            acc2Fund.wait();
            console.log(`contract funded with: ${await ethers.provider.getBalance(indexContract.address)} ether`)
        })


        it("swaps half of the collected ETH to BTC", async () => {
            const initialEthOnContract = await ethers.provider.getBalance(indexContract.address);
            const halfInitial = initialEthOnContract.div(2);
            console.log(`half initial: ${halfInitial}`);
            const tx = await indexContract.balanceFund();
            console.log(`tx: ${tx}`);
            tx.wait();
            const txGasLimit = tx.gasLimit;
            const txGasPrice = tx.gasPrice;
            const gasSpent = txGasLimit.mul(ethers.BigNumber.from(txGasPrice));
            console.log(`gas spent: ${gasSpent}`);
            const finalEthOnContract = await ethers.provider.getBalance(indexContract.address);
            expect(finalEthOnContract).to.eq(halfInitial.sub(gasSpent));
        });

        // it("")
    });

    describe("When convertToWeth() is called in the IndexContract.sol", async () => {

        beforeEach(async () => {
            const acc1Fund = await indexContract.connect(acc1).receive_funds({ "value": ethers.utils.parseEther("10"), });
            acc1Fund.wait();
            console.log(`contract funded with: ${await ethers.provider.getBalance(indexContract.address)} wei`)
        })

        it("should convert ETH in contract to WETH", async () => {
            // initial eth balance of contract
            const ethBal = await ethers.provider.getBalance(indexContract.address)
            console.log(`ETH Balance: ${ethers.utils.formatEther(ethBal)}`)

            // convert balance of smart contract to weth 
            await indexContract.convertToWeth();
            console.log('Conversion from ETH to WETH')

            // retrieve weth balance 
            const wethBal = await indexContract.wethBalance();
            console.log(`WETH Balance: ${ethers.utils.formatEther(wethBal)}`)

            expect(ethBal).to.eq(wethBal);
        })


    })

    // Uniswap functionality 
    describe("When getAmountOutMin() & swap() is called", async () => {

        beforeEach(async () => {
            const acc1Fund = await indexContract.connect(acc1).receive_funds({ "value": ethers.utils.parseEther("10"), });
            acc1Fund.wait();
            console.log(`contract funded with: ${await ethers.provider.getBalance(indexContract.address)} wei`)

            // initial eth balance of contract
            const ethBal = await ethers.provider.getBalance(indexContract.address)
            console.log(`ETH Balance: ${ethers.utils.formatEther(ethBal)}`)

            // convert balance of smart contract to weth 
            await indexContract.convertToWeth();
            console.log('Conversion from ETH to WETH')
        })


        it("getAmountOutMin() - Get min amount of WBTC for 1 WETH", async () => {
            const swapAmount = ethers.utils.parseEther("1.0")
            // convert balance of smart contract to weth 
            const expectedAmountWBTC = await indexContract.connect(deployer).getAmountOutMin(
                '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', //tokenIn
                '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // tokenOut
                swapAmount
            );
            console.log(`WBTC to be received for 1 ETH: ${expectedAmountWBTC}`)

            expect(expectedAmountWBTC).to.not.eq(0);
        })

        it("swap() - Get min amount of WBTC for 1 WETH", async () => {
            // amount ot swap 
            const swapAmount = ethers.utils.parseEther("1.0")

            // convert balance of smart contract to weth 
            const expectedAmountWBTC = await indexContract.connect(deployer).getAmountOutMin(
                '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', //tokenIn
                '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // tokenOut
                swapAmount
            );
            console.log(`WBTC to be received for 1 ETH: ${expectedAmountWBTC}`)


            // swap weth for wbtc 
            const swapTx = await indexContract.connect(deployer).swap(
                '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', //tokenIn
                '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // tokenOut
                swapAmount, //amountIn 
                expectedAmountWBTC, // amountOut
                indexContract.address
            );

            console.log('swap initated')
            const swapTxReceipt = swapTx.wait();
            console.log('swap completed')


            // get wbtc balance
            const WBTCcontract = new ethers.Contract('0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', abi, deployer);
            const WBTCBalance = await WBTCcontract.balanceOf(indexContract.address);

            expect(WBTCBalance).to.eq(expectedAmountWBTC);
        })

    })




})