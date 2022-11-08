import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { IndexContract } from '../typechain-types/contracts/IndexContract.sol'; // import other contract for local deployment 
import { IndexToken } from '../typechain-types/contracts'; // import other contract for local deployment 
import * as WethABI from "./wethABI/wethABI.json";
import { BigNumber, Contract } from "ethers";
import { abi as ERC20ABI} from '../artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json';
import { UniswapMockContract } from "../typechain-types/contracts/UniswapMockContract.sol";

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

    let uniContract: UniswapMockContract;

    beforeEach(async () => {
        console.log(`Weth abi: ${WethABI}`);
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
        AWethContract = new ethers.Contract(aWEth, WethABI, deployer); //just use WethABI as only need balance of
        AWbtcContract = new ethers.Contract(aWBTC, ERC20ABI, deployer); //just use WethABI as only need balance of

        // deploy mock uniswap contract 
        const UniContractFactory = await ethers.getContractFactory('UniswapMockContract');
        uniContract = await UniContractFactory.deploy();


    });

    describe("when rebalance is called on an eth heavy distribution", async () => {
        beforeEach(async () => {
            // fund contract
            const acc1Fund = await indexContract.connect(acc1).receive_funds({ "value": ethers.utils.parseEther("3"), });
            acc1Fund.wait();
            console.log(`contract funded with: ${await ethers.provider.getBalance(indexContract.address)} wei`)
            // allow uniswap mck to spend eth
            // swap 1/10th user eth to Weth
            const ethSwap = wethContract.deposit()
            // const ethSwap = await uniContract.connect(acc1).convertToWeth();
            ethSwap.wait();
            console.log("eth swapped to weth");
            // deposit all weth to aave
            const wethBalance = await wethContract.balanceOf(acc1);
            console.log(`wallet weth balance: ${wethBalance}`);
            const aaveDeposit = await uniContract.connect(acc1).depositToAave(wethContract.address, wethBalance);
            aaveDeposit.wait();
            console.log("Aave deposited");
            const awethOnWallet = AWethContract.balanceOf(acc1.address); 
            console.log(`aweth on wallet: ${awethOnWallet}`);  
            AWethContract.connect(acc1).transfer(indexContract.address, awethOnWallet);
        })
        it("should give  correct amount of aweth on contract", async () => {
            const awethOnIndexContract = AWethContract.balanceOf(indexContract.address);  
            console.log(`aweth on wallet: ${awethOnIndexContract}`); 

        })

    })
})