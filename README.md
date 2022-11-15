## Supplementary Materials

- Presentation Deck: https://docs.google.com/presentation/d/1Sfn-H8GhxNbEyPe8hgma-1Tqg-hPGAXWC9BWlXFlBqk/edit?usp=sharing
- Public Reference: https://medium.com/encode-club/encode-solidity-bootcamp-september-7-pm-summary-7c9140fdf7a9

## Installation

navigate to the backend folder and install yarn (This installs all dependencies):

```bash
$ yarn install
```
create a .env file in the backend folder and insert the following keys:
MNEMONIC="*********************"
PRIVATE_KEY="****************"
INFURA_API_KEY="*************"
INFURA_API_SECRET="**************"
ALCHEMY_API_KEY="******************"
ETHERSCAN_API_KEY="*********************"

run the following in the backend folder (This starts HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/):

```bash
$ yarn hardhat node 
```

Open a new terminal window in the backend folder and run (This deploys the index contract and the token contract and assigns roles):

```bash
$ yarn hardhat run --network localhost scripts/deployBoth.ts
```

Set up the API which can be found here: https://github.com/jhehemann/api_decentralized_index_protocol.
Open a new terminal window and navigate to the smart-contract-api directory of the API repository. In this directory install yarn and start the app (This activates the API service – accessible via browser at “localhost:3000/docs):

```bash
$ yarn install
$ yarn start:dev
```

Open a new terminal window and navigate to the frontend folder into the my-app directory in the Eth_lisbon repository. Install yarn and start angular:

```bash
$ yarn install
$ ng serve
```

The Frontend is now accessible at "localhost:4200".



