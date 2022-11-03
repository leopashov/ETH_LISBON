// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IIndexToken is IERC20 {
    // interface to interact with token contract

    function grantRole(bytes32 role, address sender) external;

    function MINTER_ROLE() external view returns (bytes32);

    function mint(address to, uint256 amount) external;

    function burn(address from, uint256 amount) external;
}

interface IYearnVaultToken is IERC20 {
    function pricePerShare() external view returns (uint256);
}

contract IndexContract {
    // Define 'global' variables
    IIndexToken public tokenContract;

    address[] private _vaultTokens;
    uint256 public indexValue; // index value quoted in eth
    // @xm3van: let's denominate in wei for sake of consistency
    uint256 public totalUserDeposits; // might aswell keep i think
    mapping(address => uint256) public addressToAmountFunded; // maps address to how much they have funded the index with - remove - user's token balance proportional to their funding!
    // actually keep - we can then calculate the profit of the position and take a performance fee.
    mapping(address => uint256) public tokenIndexValues; // maps token address to value (in eth) of that token in the index
    mapping(address => address) public VaultTokenToToken; // maps aToken address to corresponding token address.
    mapping(address => uint256) public tokenIndexProportion; // input: token address, output what proportion of total fund value is from the token.

    // Define Events
    event liquidtyRemoved(uint256 amount);

    constructor(
        address _tokenContract,
        address[] memory vaultTokens,
        address[] memory tokens
    ) {
        tokenContract = IIndexToken(_tokenContract);
<<<<<<< HEAD
        currentTokenSupply = tokenContract.totalSupply();
    };
=======
        // read in provided vault token addresses
        _vaultTokens = vaultTokens;
        // map vault tokens to underlying - careful of order!
        for (uint8 i = 0; i < tokens.length; i++) {
            VaultTokenToToken[_vaultTokens[i]] = tokens[i];
        }
    }
>>>>>>> dc1822c166cac78ff77d092deeb4808217f341bc

    function receive_funds() public payable {
        // allows users to send eth to the contract.
        // on doing so should mint tokens proportionate to eth added compared to
        // value of fund.
        //calculate number of index tokens to mint
        uint256 tokensToMint = calculateTokensToMint(msg.value); //double check logic
        tokenContract.mint(msg.sender, tokensToMint);
        currentTokenSupply = tokenContract.totalSupply()
        // totalUserDeposits += msg.value; // <- @xm3van: remove total user deposit == total token supply
        // addressToAmountFunded[address(msg.sender)] += msg.value; // <- @xm3van: address tokenbalance == contribution
    };

    function calculateTokensToMint(uint256 _ethReceived)
        internal
        view
        returns (uint256 tokensToMint) {
        /// @dev: require stament to prevent unreasonale small contribution extending
        /// decimals beyond reason.
        require(
            _ethReceived > 100000000000000000 wei,
            "Please increase the minimum contribution to 0.1 Ether!"
        );
        if (tokenContract.totalSupply() == 0) {
            // if no tokens minted, mint 1 token for each unit of eth received
            // sets index token = 1 eth at start
            return (_ethReceived);
        } else {
            // adding eth to the index returns
            uint256 currentTokenSupply = tokenContract.totalSupply();
            uint256 toMint = (currentTokenSupply * _ethReceived) / indexValue;
            return (toMint);
            //think of eth recvieved in terms of pool value
        }
    }

<<<<<<< HEAD
    // @xm3van: what the point of getCurrentTokens()? If you need to token addresses could you not directly call
    // the variable by making it public? 
    // Suggestion: remove getCurrentTokens() functions and same function from IndexContractTest.ts
    function getCurrentTokens()
        external
        view
        returns (address[] memory tokens){
        // shows tokens in index
        return tokens;
    }


    // @xm3van: what the point of getBalance()
    // Suggestion: remove() if functionality is need call directly from tokencontract
    function getBalance(address token) external view returns (uint256) {}
=======
    function returnIndexTokens(uint256 amount) public {
        // function to facilitate return of Index Tokens to Index contract. Will be part of 'remove Liquidity' functionality
        require(amount > 0, "You need to return at least some tokens");
        uint256 allowance = tokenContract.allowance(msg.sender, address(this));
        require(allowance >= amount, "Check the token allowance");
        tokenContract.transferFrom(msg.sender, address(this), amount);
    }

    function burnIndexTokens(uint256 amount) public {
        tokenContract.burn(address(this), amount);
    }

    function returnEth(uint256 amount) public {
        payable(msg.sender).transfer(amount);
    }
>>>>>>> dc1822c166cac78ff77d092deeb4808217f341bc

    function removeLiquidity(uint256 amount) public {
        // # user sends index tokens back to contract
        require(amount > 0, "Provide amount of liquidity to remove");
        // get allowance for this
        // @xm3van What is the rational for allowance? Time locking contribution to pools? Else Allowance = tokenbalance
        uint256 allowance = tokenContract.allowance(msg.sender, address(this));
        require(allowance >= amount, "check token allowance");
        // burn index tokens straight from user wallet
        tokenContract.burn(msg.sender, amount);
        // #call token balancing function to decide where best to remove tokens from
        emit liquidtyRemoved(amount);

        // getIndexBalance()
        // get number of tokens belonging to this address in a vault.
        // unstake tokens
        // switch tokens to eth (if required)
        // send eth back to function caller (msg.sender)
        // payable(msg.sender).transfer(amount); //typecast 'payable' to msg.sender
    }

    // @xm3van: Unit test required
    // function getIndexBalances() public {
    //     // gets current balance of index tokens
    //     indexValue = 0; //set pool value to zero
    //     for (uint8 i = 0; i < _vaultTokens.length; i++) {
    //         address vaultToken = _vaultTokens[i];
    //         //calculate value of token in vault
    //         uint256 tokenVaultValue = calculateTokenVaultValue(vaultToken);
    //         // update vault value in mapping
    //         tokenIndexValues[vaultToken] = tokenVaultValue;
    //         indexValue += tokenVaultValue; //add each token value to get total index Value
    //     }
    // }

    function calculatePoolValue() public returns (uint256 _poolValue) {
        // function to calculate pool value, denominated in eth.
        // get conversion from uni pools or chainlink(preferred)
    }


    // function calculateTokenVaultValue(address vaultToken) public {
    //     uint256 numberOfVaultTokensHeld = IERC20(vaultToken).balanceOf(
    //         address(this)
    //     );
    //     uint256 individualVaultTokenValue = calculateVaultTokenPriceInEth();
    //     return (numberOfVaultTokensHeld * individualVaultTokenValue);
    // }

    // @xm3van: maybe merge with above - ideally we directly get the ETH-Token pair
    // function calculateVaultTokenPriceInEth(address vaultToken)
    //     public
    //     returns (uint256 price)
    // {
    //     // get price of vault token quoted in underlying
    //     address tokenAddress = VaultTokenToToken[vaultToken];
    //     // ### get price of underlying in eth => CHAINLINK REQUIRED ###
    // }

    // @xm3van: Integration testing required 
    // function swapEthForToken() {}
    // // swap eth for token depending on constant balancing of the pools


    // @xm3van Unit testing possible 
    // function balanceFund() public {
    //     // MAIN BALANCE FUNCTION
    //     // check proportions of tokens within index
    //     uint8 maxIndex = updateTokenProportions();
    //     if (tokenIndexProportion[_vaultTokens[maxIndex]] > 36) {
    //         // sales required, need to balance
    //         uint256 surplus = tokenIndexProportion - 33;
    //         unstakeAndSell(surplus);
    //     }
    //     // withdraw and sell tokens which are too high proportion
    //     // buy and deposit tokens which are low proportion
    // }

    // function unstakeAndSell(uint256 amount, token) private onlyOwner {
    //     // IMPORTANT - CHECK VISIBILITY/ACCESS TO THIS FUNCTION
    //     pass;
    // }

    function updateTokenProportionsAndReturnMaxLoc()
        public
        returns (uint8 maxIndex)
    {
        uint8 maxAt = 0;
        if (indexValue > 0) {
            for (uint8 i = 0; i < _vaultTokens.length; i++) {
                address vaultToken = _vaultTokens[i];
                address underlyingTokenAddress = VaultTokenToToken[vaultToken];

                tokenIndexProportion[underlyingTokenAddress] =
                    tokenIndexValues[underlyingTokenAddress] /
                    indexValue;
                if (
                    i > 0 &&
                    tokenIndexProportion[underlyingTokenAddress] >
                    tokenIndexProportion[VaultTokenToToken[_vaultTokens[i - 1]]]
                ) {
                    maxAt = i;
                }
            }
        } else {
            maxAt = 4; // maxAt = 4 means index value = 0 - instruct purchases of tokens
        }
        // return index of largest proportion - need to sell this first before
        // attempting to buy other tokens
        return (maxAt);
    }

    // @xm3van: Seems like it got out fo place integration into updateTokenProportions()
    // if (tokenIndexProportion > 36) {
    //    uint256 surplus = tokenIndexProportion - 33;
    //    unstakeAndSell(surplus);
    // } else if (tokenIndexProportion < 30) {
    //     uint256 deficit = 30 - tokenIndexProportion;
    //     unstakeAndBuy(deficit);
    // }

    // stretchgoals: enable voting to change index -proportions, address whitelisting...
}
