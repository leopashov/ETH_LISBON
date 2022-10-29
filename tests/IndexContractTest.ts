import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { IndexContract } from '../typechain-types/contracts/IndexContract.sol'; // import other contract for local deployment 
import { IndexToken } from '../typechain-types/contracts'; // import other contract for local deployment 

describe("IndexContract", function () {
    let tokenContract: IndexToken;
    let indexContract: IndexContract;
    // let tokenInterface: IIndexToken;
    // let accounts: SignerWithAddress[] | { address: PromiseOrValue<string>; }[];
    let deployer: SignerWithAddress;
    let acc1: SignerWithAddress;
    let acc2: SignerWithAddress;

    beforeEach(async () => {
        [deployer, acc1, acc2] = await ethers.getSigners();

        // get contract  
        const tokenContractFacory = await ethers.getContractFactory('IndexToken');
        const indexContractFactory = await ethers.getContractFactory('IndexContract');

        // deploy contract 
        // Note: ensure tokenContract is deployed before indexContract

        /// token contract 
        tokenContract = await tokenContractFacory.deploy();
        await tokenContract.deployed();
        console.log("tokenContract deployed!")

        /// deploy indexContract 
        indexContract = await indexContractFactory.deploy(
            tokenContract.address,
        );
        await indexContract.deployed();
        console.log("indexContract deployed!")

        // const MINTER_ROLE = await erc20Token.MINTER_ROLE();
        // const grantRoleTx = await erc20Token.grantRole(
        //     MINTER_ROLE,
        //     tokenSaleContract.address
        // );
        // await grantRoleTx.wait();
        // // TODO: give role on the ERC721

    });


    describe("When the owner withdraw from the Shop contract", () => {

        it("recovers the right amount of ERC20 tokens", () => {
            throw new Error("Not implemented");
        });

        it("updates the owner account correctly", () => {
            throw new Error("Not implemented");
        });

    });

});
// ===



// describe("NFT Shop", async () => {
//     let tokenSaleContract: TokenSale;
//     let erc20Token: MyERC20Token;
//     let erc721Token: MyERC721Token;


//     beforeEach(async () => {
//         [deployer, acc1, acc2] = await ethers.getSigners();
//         const erc20TokenFactory = await ethers.getContractFactory("MyERC20Token");
//         const erc721TokenFactory = await ethers.getContractFactory("MyERC721Token");
//         const tokenSaleContractFactory = await ethers.getContractFactory(
//             "TokenSale"
//         );
//         erc20Token = await erc20TokenFactory.deploy();
//         await erc20Token.deployed();
//         erc721Token = await erc721TokenFactory.deploy();
//         await erc721Token.deployed();
//         tokenSaleContract = await tokenSaleContractFactory.deploy(
//             ERC20_TOKEN_RATIO,
//             NFT_TOKEN_PRICE,
//             erc20Token.address,
//             erc721Token.address
//         );
//         await tokenSaleContract.deployed();
//         const MINTER_ROLE = await erc20Token.MINTER_ROLE();
//         const grantRoleTx = await erc20Token.grantRole(
//             MINTER_ROLE,
//             tokenSaleContract.address
//         );
//         await grantRoleTx.wait();
//         // TODO: give role on the ERC721
//     });

//     describe("When the Shop contract is deployed", async () => {
//         it("defines the ratio as provided in parameters", async () => {
//             const rate = await tokenSaleContract.ratio();
//             expect(rate).to.eq(ERC20_TOKEN_RATIO);
//         });

//         it("uses a valid ERC20 as payment token", async () => {
//             const paymentTokenAddress = await tokenSaleContract.paymentToken();
//             expect(paymentTokenAddress).to.eq(erc20Token.address);
//             const erc20TokenFactory = await ethers.getContractFactory("MyERC20Token");
//             const paymentTokenContract = erc20TokenFactory.attach(paymentTokenAddress);
//             const myBalance = await paymentTokenContract.totalSupply(deployer.address);
//             expect(myBalance).to.eq(0);
//             const totalSupply = await paymentTokenContract.totalSupply();
//             expect(totalSupply).to.eq(0);
//         });
//     });

//     describe("When a user purchase an ERC20 from the Token contract", async () => {
//         const amountToBeSentBn = ethers.utils.parseEther("1");
//         const amountToBeReceived = amountToBeSentBn.div(ERC20_TOKEN_RATIO);
//         let balanceBeforeBn: BigNumber;
//         let purchaseGasCosts: BigNumber;

//         beforeEach(async () => {
//             balanceBeforeBn = await acc1.getBalance()
//             console.log(balanceBeforeBn);
//             const purchaseTokenTx = await tokenSaleContract.connect(acc1).purchaseTokens({ value: amountToBeSentBn });
//             const purchaseTokenTxReceipt = await purchaseTokenTx.wait();

//             // accounting for gas
//             const gasUnitUsed = purchaseTokenTxReceipt.gasUsed;
//             const gasPrice = purchaseTokenTxReceipt.effectiveGasPrice;
//             purchaseGasCosts = gasUnitUsed.mul(gasPrice);

//         })
//         it("charges the correct amount of ETH", async () => {
//             const balanceAfterBn = await acc1.getBalance();
//             const diff = balanceBeforeBn.sub(balanceAfterBn);
//             // account for gas
//             const expectedDiff = amountToBeSentBn.add(purchaseGasCosts);
//             const error = diff.sub(expectedDiff)
//             expect(error).to.eq(0);
//         });

//         it("gives the correct amount of tokens", async () => {
//             const acc1Balance = await erc20Token.balanceOf(acc1.address);
//             expect(acc1Balance).to.eq(amountToBeSentBn.div(ERC20_TOKEN_RATIO));
//         });

//         it("increases the balance of the ETH in the contract", async () => {
//             const contractBalanceBn = await ethers.provider.getBalance(tokenSaleContract.address);
//             expect(contractBalanceBn).to.eq(amountToBeSentBn);
//         });

//         describe("When a user burns an ERC20 at the Token contract", async () => {
//             let burnGasCosts: BigNumber;
//             let approvedGasCosts: BigNumber

//             beforeEach(async () => {
//                 const aprroveTx = await erc20Token.connect(acc1).approve(tokenSaleContract.address, amountToBeReceived);
//                 const aprroveTxReceipt = await aprroveTx.wait();
//                 const approvedasUnitUsed = aprroveTxReceipt.gasUsed;
//                 const approvedGasPrice = aprroveTxReceipt.effectiveGasPrice;
//                 approvedGasCosts = approvedasUnitUsed.mul(approvedGasPrice);

//                 const burnTokensTx = await tokenSaleContract.connect(acc1).burnTokens(amountToBeReceived);
//                 const burnTokensTxReceipt = await burnTokensTx.wait();
//                 const burnGasUnitUsed = burnTokensTxReceipt.gasUsed;
//                 const burnGasPrice = burnTokensTxReceipt.effectiveGasPrice;
//                 burnGasCosts = burnGasUnitUsed.mul(burnGasPrice);

//             })
//             it("gives the correct amount of ETH", async () => {
//                 const balanceAfterBn = await acc1.getBalance();
//                 const diff = balanceBeforeBn.sub(balanceAfterBn);
//                 const expectedDiff = purchaseGasCosts.add(approvedGasCosts).add(burnGasCosts);


//             });

//             it("burns the correct amount of tokens", () => {
//                 throw new Error("Not implemented");
//             });
//         });

//         describe("When a user purchase a NFT from the Shop contract", () => {
//             it("charges the correct amount of ETH", () => {
//                 throw new Error("Not implemented");
//             });

//             it("updates the owner account correctly", () => {
//                 throw new Error("Not implemented");
//             });

//             it("update the pool account correctly", () => {
//                 throw new Error("Not implemented");
//             });

//             it("favors the pool with the rounding", () => {
//                 throw new Error("Not implemented");
//             });
//         });

//         describe("When a user burns their NFT at the Shop contract", () => {
//             it("gives the correct amount of ERC20 tokens", () => {
//                 throw new Error("Not implemented");
//             });
//             it("updates the pool correctly", () => {
//                 throw new Error("Not implemented");
//             });
//         });

//         describe("When the owner withdraw from the Shop contract", () => {
//             it("recovers the right amount of ERC20 tokens", () => {
//                 throw new Error("Not implemented");
//             });

//             it("updates the owner account correctly", () => {
//                 throw new Error("Not implemented");
//             });
//         });
//     })
// });