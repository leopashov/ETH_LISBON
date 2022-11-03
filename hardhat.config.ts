import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
require('dotenv').config({path:__dirname+'/.env'});
const { INFURA_API_ENDPOINT, INFURA_API_KEY } = process.env;

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  paths: { tests: "tests" },
  networks: {
    hardhat: {
      forking: {
        url: `https://goerli.infura.io/v3/${INFURA_API_KEY}`
      },
      hardfork: "merge"
    }
  },
};

export default config;
