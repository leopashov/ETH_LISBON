import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { IndexContract } from '../typechain-types/contracts/IndexContract.sol'; // import other contract for local deployment 
import { IndexToken } from '../typechain-types/contracts'; // import other contract for local deployment 
import { abi as WethABI } from "../artifacts/contracts/IndexToken.sol/IndexToken.json";
import { Contract } from "ethers";
import { abi as ERC20ABI } from '../artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json';

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
            })

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
        })

        describe("calculateTokensToMint()", async () => {

            beforeEach(async () => { })

            it("mints the correct number of indexTokens when initial indexToken Supply is 0", async () => {
                const initialUserIndexTokenBalance = await tokenContract.balanceOf(acc1.address);
                const tx = await indexContract.connect(acc1).receive_funds({ "value": ethers.utils.parseEther("0.11"), });
                await tx.wait();
                const finalUserIndexTokenBalanceBN = await tokenContract.balanceOf(acc1.address);
                console.log(finalUserIndexTokenBalanceBN);
                const finalUserIndexTokenBalance = ethers.utils.formatEther(String(finalUserIndexTokenBalanceBN));

                const expectedBalance = initialUserIndexTokenBalance.add(ethers.utils.parseEther("1"));
                expect(expectedBalance).to.eq(finalUserIndexTokenBalance);
            });

            it("mints the correct number of indexTokens when initial indexToken Supply is not 0", async () => {

                // Deposit 1 
                const depositValue1 = ethers.utils.parseEther((String(10 * Math.random())));
                const deposit1Tx = await indexContract.connect(acc1).receive_funds({ "value": depositValue1, });
                deposit1Tx.wait();

                // Deposit 2
                /// Deposit 2 amount
                const depositValue2 = ethers.utils.parseEther((String(10 * Math.random())));

                /// Expected indexToken resulting from deposit 2
                const currentIndexValue = ethers.utils.parseEther((String(100 * Math.random())));
                const indexValueBeforeDeposit = currentIndexValue.sub(depositValue2);
                const currentTokenSupply = await tokenContract.totalSupply();
                const formattedCurrentTokenSupply = ethers.utils.formatEther((currentTokenSupply));

                /// Expected tokens 
                const expectedIndexTokens = (currentTokenSupply.mul(depositValue2)).div(indexValueBeforeDeposit);

                /// Execution of deposit 2 
                const deposit2Tx = await indexContract.connect(acc1).receive_funds({ "value": ethers.utils.parseEther((String(depositValue2))), });
                deposit2Tx.wait();

                /// actualTokenSupply
                const actualTokenSupply = tokenContract.totalSupply();

                // execution logic 
                expect(expectedIndexTokens).to.eq(actualTokenSupply);

            })
        })

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