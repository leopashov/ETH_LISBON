import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { IndexContract } from '../typechain-types/contracts/IndexContract.sol'; // import other contract for local deployment 
import { IndexToken } from '../typechain-types/contracts'; // import other contract for local deployment 
import { abi as WethABI} from "../artifacts/contracts/IndexToken.sol/IndexToken.json";
import { BigNumber, Contract } from "ethers";
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
    let wbtcContract:Contract;
    let AWethContract: Contract;
    let AWbtcContract: Contract;

    beforeEach(async () => {
        [deployer, acc1, acc2] = await ethers.getSigners();
        wEthContractAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
        wBtcContractAddress = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";
        // hardcoded for now - atokens have ability to give underlying token 
        // contract address for extra robustness
        aWBTC = "0x9ff58f4fFB29fA2266Ab25e75e2A8b3503311656";
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
        wethContract = new ethers.Contract(wEthContractAddress, WethABI, deployer);
        wbtcContract = new ethers.Contract(wBtcContractAddress, ERC20ABI, deployer);
        AWethContract = new ethers.Contract(aWEth, WethABI, deployer); //just use WethABI as only need balance of
        AWbtcContract = new ethers.Contract(aWBTC, ERC20ABI, deployer); //just use WethABI as only need balance of
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

        it("correctly updates index USD value", async () => {
            var indexValueUSD = await indexContract.indexValueUSD();
            var indexValue = await indexContract.indexValue();
            console.log(`indexValue 1: ${indexValue}`);
            console.log(`indexValueUSD 1: ${indexValueUSD}`);
            const acc2Fund = await indexContract.connect(acc2).receive_funds({ "value": ethers.utils.parseEther("1"), });
            acc2Fund.wait();
            indexValueUSD = await indexContract.indexValueUSD();
            indexValue = await indexContract.indexValue();
            console.log(`indexValue 2: ${indexValue}`);
            console.log(`indexValueUSD 2: ${indexValueUSD}`);
            const fundedAmount = ethers.utils.parseEther("1.11");
            const updateindexValueUSD = await indexContract.updateIndexValueUSD();
            updateindexValueUSD.wait();
            indexValueUSD = await indexContract.indexValueUSD();
            indexValue = await indexContract.indexValue();
            console.log(`indexValue 3: ${indexValue}`);
            console.log(`indexValueUSD 3: ${indexValueUSD}`);

            expect(ethers.BigNumber.from(indexValueUSD)).to.eq(fundedAmount);
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
    
    
    describe("When the balanceFund() function is called", async () => {


        beforeEach(async () => {
            // fund contract from two wallets:
            const acc1Fund = await indexContract.connect(acc1).receive_funds({ "value": ethers.utils.parseEther("0.11"), });
            acc1Fund.wait();
            var indexValue = await indexContract.indexValue();
            console.log(`index value: ${indexValue}`)
            const acc2Fund = await indexContract.connect(acc2).receive_funds({ "value": ethers.utils.parseEther("1"), });
            acc2Fund.wait();
            indexValue = await indexContract.indexValue();
            console.log(`index value: ${indexValue}`)
            console.log(`contract funded with: ${await wethContract.balanceOf(indexContract.address)} ether`)
        })


        it("swaps half of the collected ETH to BTC", async () => {
            const initialWethOnContract = await wethContract.balanceOf(indexContract.address);
            const halfInitial = initialWethOnContract.div(2);
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
            const initialWethOnContract = await wethContract.balanceOf(indexContract.address);
            const halfInitial = initialWethOnContract.div(2);
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
            const wbtcPrice = wbtcPriceHex.toString();
            console.log(`Wbtc price: ${wbtcPrice}`);
            const initialWethOnContract = await wethContract.balanceOf(indexContract.address);
            const halfInitial = initialWethOnContract.div(2);
            console.log(`half initial: ${halfInitial}`)
            //const initialAWbtcBalanceValue = await indexContract.getDepositedValue(AWbtcContract.address);
            const initialAWbtcBalance = await AWbtcContract.balanceOf(indexContract.address);
            const initialAWbtcBalanceValue = wbtcPriceHex.mul(initialAWbtcBalance);
            console.log(`inital awbtc balance value: ${initialAWbtcBalanceValue}`);
            // const initialAWbtcBalance = AWbtcContract.balanceOf(indexContract.address);
            const tx = await indexContract.connect(acc2).balanceFund();
            tx.wait();
            const AWbtcDecimals = await AWbtcContract.decimals();
            console.log(`awbtc decimals: ${AWbtcDecimals}`);
            const finalAWbtcBalance = await AWbtcContract.balanceOf(indexContract.address);
            console.log(`final awbtc balance: ${finalAWbtcBalance}`);
            const finalAWbtcBalanceValueBN = wbtcPriceHex.mul(finalAWbtcBalance);
            
            // const finalAWbtcBalanceValue = ethers.utils.formatUnits(finalAWbtcBalanceValueBN, AWbtcDecimals);
            console.log(`final awbtc balance value BN: ${finalAWbtcBalanceValueBN}`);
            const divider = 10**AWbtcDecimals;
            const finalAWbtcBalanceValue = finalAWbtcBalanceValueBN.div(divider);
            console.log(`final awbtc balance value: ${finalAWbtcBalanceValue}`);
            expect(halfInitial).to.be.lessThanOrEqual(finalAWbtcBalanceValue);
            // current conversion 1AWBTC = 1.03 WBTC, dont know why
        });

        it("should have equal values of aWBTC and aWETH on the contract", async () => {
            const initialWethOnContract = await wethContract.balanceOf(indexContract.address);
            const halfInitial = initialWethOnContract.div(2);
            console.log(`half initial: ${halfInitial}`)
            const initialAWethBalance = await AWethContract.balanceOf(indexContract.address);
            console.log(`inital aweth balance: ${initialAWethBalance}`);
            // const initialAWbtcBalance = AWbtcContract.balanceOf(indexContract.address);
            const tx = await indexContract.connect(acc2).balanceFund();
            tx.wait();
            const finalAWethBalance = await AWethContract.balanceOf(indexContract.address);
            console.log(`final aweth balance: ${finalAWethBalance}`);

            const wbtcPriceHex = await indexContract.getWbtcPrice();
            const wbtcPrice = wbtcPriceHex.toString();
            console.log(`Wbtc price: ${wbtcPrice}`);
            console.log(`half initial: ${halfInitial}`)
            //const initialAWbtcBalanceValue = await indexContract.getDepositedValue(AWbtcContract.address);
            const initialAWbtcBalance = await AWbtcContract.balanceOf(indexContract.address);
            const initialAWbtcBalanceValue = wbtcPriceHex.mul(initialAWbtcBalance);
            console.log(`inital awbtc balance value: ${initialAWbtcBalanceValue}`);
            const AWbtcDecimals = await AWbtcContract.decimals();
            console.log(`awbtc decimals: ${AWbtcDecimals}`);
            const finalAWbtcBalance = await AWbtcContract.balanceOf(indexContract.address);
            console.log(`final awbtc balance: ${finalAWbtcBalance}`);
            const finalAWbtcBalanceValueBN = wbtcPriceHex.mul(finalAWbtcBalance);
            
            // const finalAWbtcBalanceValue = ethers.utils.formatUnits(finalAWbtcBalanceValueBN, AWbtcDecimals);
            console.log(`final awbtc balance value BN: ${finalAWbtcBalanceValueBN}`);
            const divider = 10**AWbtcDecimals;
            const finalAWbtcBalanceValue = finalAWbtcBalanceValueBN.div(divider);
            console.log(`final awbtc balance value: ${finalAWbtcBalanceValue}`);
            expect(finalAWethBalance).to.eq(finalAWbtcBalanceValue);
            // close enough
        })
    });

    describe("get wbtc price in terms of eth", () => {
        it("retreives the price of wbtc denominated in eth", async () => {
            const wbtcPriceHex = await indexContract.getWbtcPrice();
            const wbtcPriceBN = wbtcPriceHex.toString();
            console.log(`wbtcPriceBN ${String(wbtcPriceBN)}`);
            const wbtcPrice = ethers.utils.formatEther(String(wbtcPriceBN));
            console.log(wbtcPrice);
            //expect(wbtcPrice).to
            //expect price to be ~12.98
        })
    });

    describe("get eth price in terms of usd", () => {

        it("retreives the price of eth denominated in usd", async () => {
            const ethPriceHex = await indexContract.getEthPrice();
            const ethPriceBN = ethPriceHex.toString();
            console.log(`ethPriceBN ${String(ethPriceBN)}`);
            const ethPrice = ethers.utils.formatEther(String(ethPriceBN));
            console.log(ethPrice);
        })
    })


    describe("When convertToWeth() is called in the IndexContract.sol", async () => {

        beforeEach(async () => {
            const acc1Fund = await indexContract.connect(acc1).receive_funds({ "value": ethers.utils.parseEther("0.11"), });
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