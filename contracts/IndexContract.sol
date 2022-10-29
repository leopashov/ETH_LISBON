// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IIndexToken {
    // interface to interact with token contract
    // function...
    function mint(address to, uint256 amount) external;

    function totalSupply() external view returns (uint256);
}

contract IndexContract {
    // Dfeine 'global' variables
    IIndexToken public tokenContract;
    address[] private _tokens;
    uint256 public poolValue; // pool value quoted in eth
    uint256 public currentTokenSupply;
    mapping(address => uint256) public tokenIndexValues; // maps token address to value (in eth) of that token in the index

    // Define Events
    event liquidtyRemoved(uint256 amount);

    constructor(address _tokenContract) {
        tokenContract = IIndexToken(_tokenContract);
        currentTokenSupply = tokenContract.totalSupply();
        // consider minting one token and adding eth to pool here
    }

    /// @Notice: call outside of constructor
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

        tokenContract.mint(msg.sender, tokensToMint);
    }

    function calculateTokensToMint(uint256 _ethReceived)
        internal
        view
        returns (uint256 tokensToMint)
    {
        if (poolValue == 0) {
            // if pool empty, just mint 1 token irrespective of what was contributed
            // this will just affect the rate at which pool tokens are created
            // ie order of magnitude of max supply
            return (1);
        } else {
            // adding eth to the index returns
            return (currentTokenSupply * (_ethReceived / poolValue));
            //think of eth recvieved in terms of pool value
            // potnetial issue with small contributions - small number/large number
            // no decimals in solidity
            // set multiplier or something?
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
        return _tokens;
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
        tokenContract.burn(amount);
        // #call token balancing function to decide where best to remove tokens from
        getIndexBalance()
        // get number of tokens belonging to this address in a vault.
        // unstake tokens
        // switch tokens to eth (if required)
        // send eth back to function caller (msg.sender)
        payable(msg.sender).transfer(amount); //typecast 'payable' to msg.sender
    }

    function getIndexBalance() public {
        // gets current balance of index tokens
        for (uint8 i=0; i < _tokens.length(); i++){
            //calculate value of token in vault
            
            tokenIndexValues[_tokens[i]] = 
        }
    }

    function swapEthForToken() public {}

    // swap eth for token depending on constant balancing of the pools

    function balanceFund() public {
        // MAIN BALANCE FUNCTION
        // check proportions of toknes within index
        // withdraw and sell tokens which are too high proportion
        // buy and deposit tokens which are low proportion
    }

    // stretchgoals: enable voting to change index -proportions, address whitelisting...
}
