import {ethers} from 'hardhat';
import helpers from "@nomicfoundation/hardhat-network-helpers";

async function main() {
    const address = "0x1234567890123456789012345678901234567890";
    await helpers.impersonateAccount(address);
    const impersonatedSigner = await ethers.getSigner(address);
    console.log(impersonatedSigner);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });