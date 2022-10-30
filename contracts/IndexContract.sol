// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "@openzeppelin/contracts/access/Ownable.sol";

interface IIndexToken is IERC20 {
    function grantRole(bytes32 role, address sender) external;

    function MINTER_ROLE() external view returns (bytes32);

    // interface to interact with token contract
    function mint(address to, uint256 amount) external;
}

interface IYearnVaultToken is IERC20 {
    function pricePerShare() external view returns (uint256);
}

contract IndexContract is Ownable {
    // Define 'global' variables
    IIndexToken public tokenContract;

    address[] public _vaultTokens;
    uint256 public indexValue; // index value quoted in eth
    uint256 public currentTokenSupply;
    mapping(address => uint256) public tokenIndexValues; // maps token address to value (in eth) of that token in the index
    mapping(address => address) public VaultTokenToToken; // maps aToken address to corresponding token address.
    mapping(address => uint256) public tokenIndexProportion;
    // Define Events
    event liquidtyRemoved(uint256 amount);

    constructor(address _tokenContract, address[] memory vaultTokens) {
        tokenContract = IIndexToken(_tokenContract);
        currentTokenSupply = tokenContract.totalSupply();
        // tokenContract.grantRole(keccak256("MINTER_ROLE"), address(this));
        // INPUT INITIAL CONDITIONS TO ALLOW UNIT TESTS
        _vaultTokens = vaultTokens;
        indexValue = 0;
    }

    function updateTotalSupply() external {
        currentTokenSupply = tokenContract.totalSupply();
        // updates currentTokenSupply
        // Comment: I think we can avoid this compelety by
        // tokenContract.totalSupply() directly for calculation
    }

    function receive_funds() public payable {
        // allows users to send eth to the contract.
        // on doing so should mint tokens proportionate to eth added compared to
        // value of fund.
        //calculate number of index tokens to mint
        uint256 tokensToMint = calculateTokensToMint(msg.value); //double check logic
        // assign minter role to msg.sender
        // Ref.: https://docs.openzeppelin.com/contracts/3.x/access-control#granting-and-revoking
        // tokenContract.grantRole(
        //     tokenContract.MINTER_ROLE(),
        //     address(msg.sender)
        // );

        // mint token
        tokenContract.mint(msg.sender, tokensToMint);
    }

    function calculateTokensToMint(uint256 _ethReceived)
        internal
        returns (uint256 tokensToMintinWei)
    {
        require(
            _ethReceived > 100000000 gwei,
            "Please increase the minimum contribution to 0.1 Ether!"
        );

        if (indexValue == 0) {
            // if pool empty, just mint 1 token irrespective of what was contributed
            // this will just affect the rate at which pool tokens are created
            // ie order of magnitude of max supply
            uint256 mintAmount = 1 ether;
            // update current token supply
            currentTokenSupply += mintAmount;
            indexValue += _ethReceived;
            return (mintAmount);
        } else {
            // adding eth to the index returns
            uint256 mintAmount = (currentTokenSupply * _ethReceived) /
                indexValue;
            // update index value
            indexValue += _ethReceived;
            currentTokenSupply += mintAmount;
            return (mintAmount);
            // ^this division giving issues - rounds down to zero each time
            // need to calculate in gwei or something
        }
    }

    function calculatePoolValue() public returns (uint256 _poolValue) {
        // function to calculate pool value, denominated in eth.
        // get conversion from uni pools or chainlink(preferred)
    }

    function getCurrentTokens()
        external
        view
        returns (address[] memory tokens)
    {
        // shows tokens in index
        return _vaultTokens;
    }

    function getBalance(address token) external view returns (uint256) {}

    function removeLiquidity(uint256 amount) public {
        // # user sends index tokens back to contract
        require(amount > 0, "Provide amount of liquidity to remove");
        // get allowance for this
        uint256 allowance = tokenContract.allowance(msg.sender, address(this));
        require(allowance >= amount, "check token allowance");
        // transfer token from user wallet to this contract
        tokenContract.transferFrom(msg.sender, address(this), amount);
        emit liquidtyRemoved(amount);
        // burn returned index tokens
        // tokenContract.burn(amount);
        // #call token balancing function to decide where best to remove tokens from
        // getIndexBalance()
        // get number of tokens belonging to this address in a vault.
        // unstake tokens
        // switch tokens to eth (if required)
        // send eth back to function caller (msg.sender)
        payable(msg.sender).transfer(amount); //typecast 'payable' to msg.sender
    }

    function getIndexBalances() public {
        // gets current balance of index tokens
        indexValue = 0; //set pool value to zero
        for (uint8 i = 0; i < _vaultTokens.length; i++) {
            address vaultToken = _vaultTokens[i];
            //calculate value of token in vault
            uint256 tokenVaultValue = calculateTokenVaultValue(vaultToken);
            // update vault value in mapping
            tokenIndexValues[vaultToken] = tokenVaultValue;
            indexValue += tokenVaultValue; //add each token value to get total index Value
        }
    }

    function calculateTokenVaultValue(address vaultToken)
        public
        view
        returns (uint256 tokenVaultValue)
    {
        uint256 numberOfVaultTokensHeld = IERC20(vaultToken).balanceOf(
            address(this)
        );
        uint256 individualVaultTokenValue = calculateVaultTokenPriceInEth(
            vaultToken
        );
        return (numberOfVaultTokensHeld * individualVaultTokenValue);
    }

    function calculateVaultTokenPriceInEth(address vaultToken)
        public
        view
        returns (uint256 price)
    {
        // get price of vault token quoted in underlying
        address tokenAddress = VaultTokenToToken[vaultToken];
        // ### get price of underlying in eth => CHAINLINK REQUIRED ###
        return (1);
    }

    function swapEthForToken() private {}

    // swap eth for token depending on constant balancing of the pools

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

    // function updateTokenProportions() public returns (uint8 maxIndex) {
    //     uint8 maxAt = 0;
    //     for (uint8 i = 0; i < _vaultTokens.length; i++) {
    //         address vaultToken = _vaultTokens[i];
    //         address tokenAddress = VaultTokenToToken[vaultToken];
    //         tokenIndexProportion[tokenAddress] =
    //             tokenIndexValues[tokenAddress] /
    //             indexValue;
    //         if (
    //             i > 0 &&
    //             tokenIndexProportion[tokenAddress] >
    //             tokenIndexProportion[VaultTokenToToken[_vaultTokens[i - 1]]]
    //         ) {
    //             maxAt = i;
    //         }
    //     }
    //     // return index of largest proportion - need to sell this first before
    //     // attempting to buy other tokens
    //     return (maxAt);
    // }

    // if (tokenIndexProportion > 36) {
    //    uint256 surplus = tokenIndexProportion - 33;
    //    unstakeAndSell(surplus);
    // } else if (tokenIndexProportion < 30) {
    //     uint256 deficit = 30 - tokenIndexProportion;
    //     unstakeAndBuy(deficit);
    // }

    // stretchgoals: enable voting to change index -proportions, address whitelisting...
    // automate rebalancing
}
