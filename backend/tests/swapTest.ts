import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { artifacts, ethers } from "hardhat";
import { IndexContract } from '../typechain-types/contracts/IndexContract.sol'; // import other contract for local deployment 
import { IndexToken } from '../typechain-types/contracts'; // import other contract for local deployment 
import { abi } from '../artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json';

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

    describe("When convertToWeth() is called in the IndexContract.sol", async () => {

        beforeEach(async () => {
            const acc1Fund = await indexContract.connect(acc1).receive_funds({ "value": ethers.utils.parseEther("10"), });
            acc1Fund.wait();
            const acc2Fund = await indexContract.connect(acc2).receive_funds({ "value": ethers.utils.parseEther("30"), });
            acc2Fund.wait();
            console.log(`contract funded with: ${ethers.utils.formatEther(await indexContract.wethBalance())} WETH`)
        })

        // it("should convert ETH in contract to WETH", async () => {
        //     // initial eth balance of contract
        //     const ethBal = await ethers.provider.getBalance(indexContract.address);
        //     console.log(`ETH Balance: ${ethers.utils.formatEther(ethBal)}`);

        //     // convert balance of smart contract to weth 
        //     const toWethTx = await indexContract.convertToWeth();
        //     toWethTx.wait();
        //     console.log('Conversion from ETH to WETH');

        //     // retrieve weth balance 
        //     const wethBal = await indexContract.wethBalance();
        //     console.log(`WETH Balance: ${ethers.utils.formatEther(wethBal)}`);

        //     expect(ethBal).to.eq(wethBal);
        //     // NOTE: test does not work as we changed smart contract logic and 
        //     // receive_funds() automatically converts to WETH (i.e. intial eth bal=0)
        // });


        it("should convert WETH in contract to ETH ", async () => {
            // retrieve weth balance 
            const wethBal = await indexContract.wethBalance();
            console.log(`WETH Balance: ${ethers.utils.formatEther(wethBal)}`);

            // convert to eth 
            const unwrapTx = await indexContract.connect(acc1).unwrapEth(wethBal);
            unwrapTx.wait();
            console.log(`WETH to ETH`)

            // log eth balance 
            const ethBal = await ethers.provider.getBalance(indexContract.address);
            console.log(`ETH Balance: ${ethers.utils.formatEther(ethBal)}`)

            expect(wethBal).to.eq(ethBal);
            console.log('=========')
        });


    });

    // describe("When getAmountOutMin() & swap() is called", async () => {

    //     beforeEach(async () => {
    //         const acc1Fund = await indexContract.connect(acc1).receive_funds({ "value": ethers.utils.parseEther("10"), });
    //         acc1Fund.wait();
    //         console.log(`contract funded with: ${await ethers.provider.getBalance(indexContract.address)} wei`)

    //         // initial eth balance of contract
    //         const ethBal = await ethers.provider.getBalance(indexContract.address)
    //         console.log(`ETH Balance: ${ethers.utils.formatEther(ethBal)}`)

    //         // convert balance of smart contract to weth 
    //         await indexContract.convertToWeth();
    //         console.log('Conversion from ETH to WETH')
    //     })


    //     it("getAmountOutMin() - Get min amount of WBTC for 1 WETH", async () => {
    //         const swapAmount = ethers.utils.parseEther("1.0")
    //         // convert balance of smart contract to weth 
    //         const expectedAmountWBTC = await indexContract.connect(deployer).getAmountOutMin(
    //             '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', //tokenIn
    //             '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // tokenOut
    //             swapAmount
    //         );
    //         console.log(`WBTC to be received for 1 ETH: ${expectedAmountWBTC}`)

    //         expect(expectedAmountWBTC).to.not.eq(0);
    //     })

    //     it("swap() - Get min amount of WBTC for 1 WETH", async () => {
    //         // amount ot swap 
    //         const swapAmount = ethers.utils.parseEther("1.0")

    //         // convert balance of smart contract to weth 
    //         const expectedAmountWBTC = await indexContract.connect(deployer).getAmountOutMin(
    //             '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', //tokenIn
    //             '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // tokenOut
    //             swapAmount
    //         );
    //         console.log(`WBTC to be received for 1 ETH: ${expectedAmountWBTC}`)


    //         // swap weth for wbtc 
    //         const swapTx = await indexContract.connect(deployer).swap(
    //             '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', //tokenIn
    //             '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // tokenOut
    //             swapAmount, //amountIn 
    //             expectedAmountWBTC, // amountOut
    //             indexContract.address
    //         );

    //         console.log('swap initated')
    //         const swapTxReceipt = swapTx.wait();
    //         console.log('swap completed')


    //         // get wbtc balance
    //         const WBTCcontract = new ethers.Contract('0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', abi, deployer);
    //         const WBTCBalance = await WBTCcontract.balanceOf(indexContract.address);

    //         expect(WBTCBalance).to.eq(expectedAmountWBTC);
    //     })

    // })

});