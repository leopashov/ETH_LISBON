// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IIndexToken {
    // interface to interact with token contract
    // function...
    function mint(address to, uint256 amount) external;
}

contract IndexContract {
    IIndexToken public tokenContract;
    address[] private _tokens;
    uint256 public poolValue; // pool value quoted in eth
    uint256 public currentTokenSupply;

    constructor(address _tokenContract) {
        tokenContract = IIndexToken(_tokenContract);
    }

    /// @Notice: call outside of constructor
    function updateTotalSupply() public {
        // updates currentTokenSupply
        // Comment: I think we can avoid this compelety by
        // tokenContract.totalSupply() directly for calculation
        currentTokenSupply = tokenContract.totalSupply();
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
        }
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
}
