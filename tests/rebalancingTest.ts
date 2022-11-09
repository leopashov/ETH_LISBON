import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { IndexContract } from '../typechain-types/contracts/IndexContract.sol'; // import other contract for local deployment 
import { IndexToken } from '../typechain-types/contracts'; // import other contract for local deployment 
import WethABI from "./ABIs/wethABI.json";
import lendingPoolABi from "./ABIs/LendingPoolABI.json";
import { BigNumber, Contract } from "ethers";
import { abi as ERC20ABI} from '../artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json';
import { Provider } from "@ethersproject/providers";

describe("IndexContract Integration", function () {
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
        // console.log(`Weth abi: ${WethABI}`);
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
        console.log("indexContract deployed!");

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
        AWbtcContract = new ethers.Contract(aWBTC, ERC20ABI, deployer);
        lendingPoolContract = new ethers.Contract(lendingPool, lendingPoolABi, deployer);

    });

    describe("when rebalance is called on an eth heavy distribution", async () => {
        // see integration test file for test when rebalance is called for the first time
        beforeEach(async () => {
            // fund index contract
            const acc1Fund = await indexContract.connect(acc1).receive_funds({ "value": ethers.utils.parseEther("3"), });
            acc1Fund.wait();
            console.log(`contract funded with: ${await wethContract.balanceOf(indexContract.address)} wei`);
            // deposit eth to weth contract
            const ethSwap = await wethContract.connect(acc1).deposit({ "value": ethers.utils.parseEther("2"), })
            ethSwap.wait();
            const wethBal = await wethContract.balanceOf(acc1.address);
            // claim weth back into wallet
            const wethFetch = await wethContract.connect(acc1).transfer(acc1.address, wethBal);
            wethFetch.wait();
            
            console.log("eth swapped to weth");
            // show balance of weth in wallet
            const wethBalance = await wethContract.balanceOf(acc1.address);
            console.log(`wallet weth balance: ${wethBalance}`);
            // approve weth to be spent by aave
            const wethApprove = await wethContract.connect(acc1).approve(lendingPoolContract.address, wethBalance);
            wethApprove.wait();
            // deposit weth to aave and get aweth in return
            const aaveDeposit = await lendingPoolContract.connect(acc1).deposit(wEthContractAddress, wethBalance, acc1.address, 0);
            aaveDeposit.wait();
            console.log("Aave deposited");
            const awethOnWallet = await AWethContract.balanceOf(acc1.address); 
            console.log(`aweth on wallet: ${awethOnWallet}`); 
            // send aweth from acc1 to index contract (ie making eth heavy index)
            const AWethTransfer = await AWethContract.connect(acc1).transfer(indexContract.address, awethOnWallet);
            AWethTransfer.wait();
            const indexContractAwethBalance = await AWethContract.balanceOf(indexContract.address);
            console.log(`${indexContractAwethBalance} aweth transferred to index contract`);
            // index contract now has some (3) weth on it aswell as 2 aweth 
        })

        it("should calculate deposited value of tokens we have deposited (calculateIndexValue)", async () => {
            var returnedInfo = await indexContract.connect(acc1).calculateIndexValue();
            console.log(`deposited value: ${returnedInfo}`);
            //expect(getDepositedValuePls).to.eq(2000000000000000000);

        })


        it("should give  correct amount of aweth on contract", async () => {
            // need to fund with some awbtc to avoid division by zero
            const awethOnIndexContract = await AWethContract.balanceOf(indexContract.address);  
            console.log(`aweth on index contract: ${awethOnIndexContract}`); 
            // call 'balance fund'
            const balanceFundTx = await indexContract.connect(acc1).balanceFund();
            balanceFundTx.wait();

        })

    })
})