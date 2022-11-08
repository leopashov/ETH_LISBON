// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import {UniswapExchangeInterface} from "./interfaces/IUniswapExchangeInterface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import {IAToken} from "./interfaces/IaTokenInterface.sol";
import {ILendingPool} from "./interfaces/ILendingPool.sol";

interface IUniswapV2Router {
    function getAmountsOut(uint256 amountIn, address[] memory path)
        external
        view
        returns (uint256[] memory amounts);

    function swapExactTokensForTokens(
        //amount of tokens we are sending in
        uint256 amountIn,
        //the minimum amount of tokens we want out of the trade
        uint256 amountOutMin,
        //list of token addresses we are going to trade in.  this is necessary to calculate amounts
        address[] calldata path,
        //this is the address we are going to send the output tokens to
        address to,
        //the last time that the trade is valid for
        uint256 deadline
    ) external returns (uint256[] memory amounts);
}

interface IUniswapV2Pair {
    function token0() external view returns (address);

    function token1() external view returns (address);

    function swap(
        uint256 amount0Out,
        uint256 amount1Out,
        address to,
        bytes calldata data
    ) external;
}

interface IUniswapV2Factory {
    function getPair(address token0, address token1) external returns (address);
}

interface IWETH is IERC20 {
    function deposit() external payable;

    function withdraw(uint256) external;
}

contract UniswapMockContract {
    //address of the uniswap v2 router
    address private constant UNISWAP_V2_ROUTER =
        0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    // @Note: address same on Testnet and

    // Define 'global' variables

    IWETH public wethContract;
    IWETH public wbtcContract;
    ILendingPool public aaveV2LendingPool;

    //define aToken contracts
    IAToken public aWethContract;
    IAToken public aWBtcContract;
    AggregatorV3Interface internal WBtcPriceFeed;
    // AggregatorV3Interface internal WEthPriceFeed; only need WBtc

    // Mainnet Addresses
    address private constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address private constant WBTC = 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599;

    // Testnet Goerli Adresses
    // address private constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    // address private constant WBTC = 0xdA4a47eDf8ab3c5EeeB537A97c5B66eA42F49CdA;

    IAToken[] private _vaultTokens;
    uint256 public indexValue; // index value quoted in eth
    uint256 public awethOnContract;
    uint256 public aWbtcOnContractValue;
    uint256 wbtcOnContract;

    // @xm3van: let's denominate in wei for sake of consistency
    mapping(address => uint256) public addressToAmountFunded; // maps address to how much they have funded the index with - remove - user's token balance proportional to their funding!
    // actually keep - we can then calculate the profit of the position and take a performance fee.
    mapping(address => uint256) public tokenIndexValues; // maps token address to value (in eth) of that token in the index
    mapping(address => address) public VaultTokenToToken; // maps aToken address to corresponding token address.
    // mapping(address => uint256) public tokenIndexProportion; // input: token address, output what proportion of total fund value is from the token.
    mapping(address => IWETH) public addressToContract;
    uint256 public inverseIndexProportionBTCx100;
    // Define Events
    event liquidtyRemoved(uint256 amount);

    constructor() {
        // weth contract
        wethContract = IWETH(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);
        //wbtc contract
        wbtcContract = IWETH(0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599);

        addressToContract[
            0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
        ] = wethContract; // probably dont need this mapping - was trying something out
        addressToContract[
            0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599
        ] = wbtcContract;
        // Aave v2 lending pool contract
        aaveV2LendingPool = ILendingPool(
            0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9
        );

        //Btc/Eth price feed
        WBtcPriceFeed = AggregatorV3Interface(
            0xdeb288F737066589598e9214E782fa5A8eD689e8 // Mainnet address
        );
    }

    function swap(
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn,
        uint256 _amountOutMin,
        address _to
    ) public {
        IERC20(_tokenIn).approve(UNISWAP_V2_ROUTER, _amountIn);

        //path is an array of addresses.
        //this path array will have 3 addresses [tokenIn, WETH, tokenOut]
        //the if statement below takes into account if token in or token out is WETH.  then the path is only 2 addresses
        address[] memory path;
        if (_tokenIn == WETH || _tokenOut == WETH) {
            path = new address[](2);
            path[0] = _tokenIn;
            path[1] = _tokenOut;
        } else {
            path = new address[](3);
            path[0] = _tokenIn;
            path[1] = WETH;
            path[2] = _tokenOut;
        }
        //then we will call swapExactTokensForTokens
        //for the deadline we will pass in block.timestamp
        //the deadline is the latest time the trade is valid for
        IUniswapV2Router(UNISWAP_V2_ROUTER).swapExactTokensForTokens(
            _amountIn,
            _amountOutMin,
            path,
            _to,
            block.timestamp
        );
    }

    //this function will return the minimum amount from a swap
    //input the 3 parameters below and it will return the minimum amount out
    //this is needed for the swap function above
    function getAmountOutMin(
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn
    ) public view returns (uint256) {
        // change to internal
        //path is an array of addresses.
        //this path array will have 3 addresses [tokenIn, WETH, tokenOut]
        //the if statement below takes into account if token in or token out is WETH.  then the path is only 2 addresses
        address[] memory path;
        if (_tokenIn == WETH || _tokenOut == WETH) {
            path = new address[](2);
            path[0] = _tokenIn;
            path[1] = _tokenOut;
        } else {
            path = new address[](3);
            path[0] = _tokenIn;
            path[1] = WETH;
            path[2] = _tokenOut;
        }

        uint256[] memory amountOutMins = IUniswapV2Router(UNISWAP_V2_ROUTER)
            .getAmountsOut(_amountIn, path);
        return amountOutMins[path.length - 1];
    }

    function depositToAave(address token, uint256 amount) public {
        aaveV2LendingPool.deposit(token, amount, address(msg.sender), 0);
    }

    function convertToWeth() public {
        //public for testing - should be internal
        uint256 eth = msg.sender.balance / 10;
        wethContract.approve(address(wethContract), 2**256 - 1);
        wethContract.deposit{value: eth}();
        uint256 wethBal = wethContract.balanceOf(address(this));
        wethContract.transfer(address(msg.sender), wethBal);
    }
}
