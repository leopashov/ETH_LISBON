// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import {UniswapExchangeInterface} from "./interfaces/IUniswapExchangeInterface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import {IAToken} from "./interfaces/IaTokenInterface.sol";
import {ILendingPool} from "./interfaces/ILendingPool.sol";

import "hardhat/console.sol";

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

interface IWETH {
    function deposit() external payable;

    function withdraw(uint256 wad) external payable;

    function transfer(address to, uint256 value) external returns (bool);

    function approve(address guy, uint256 wad) external returns (bool);

    function balanceOf(address owner) external view returns (uint256);
}

interface IIndexToken is IERC20 {
    // interface to interact with token contract

    function grantRole(bytes32 role, address sender) external;

    function MINTER_ROLE() external view returns (bytes32);

    function mint(address to, uint256 amount) external;

    function burn(uint256 amount) external;

    function burnFrom(address account, uint256 amount) external;
}

contract IndexContract {
    // Function to receive Ether. msg.data must be empty
    receive() external payable {
        receive_funds();
        
    }

    // Fallback function is called when msg.data is not empty
    //fallback() external payable {}

    //Ref.: https://solidity-by-example.org/sending-ether/

    //address of the uniswap v2 router
    address private constant UNISWAP_V2_ROUTER =
        0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    // @Note: address same on Testnet and

    // Define 'global' variables
    IIndexToken public tokenContract;
    IWETH public wethContract;
    IWETH public wbtcContract;
    ILendingPool public aaveV2LendingPool;

    //define aToken contracts
    IAToken public aWethContract;
    IAToken public aWBtcContract;
    AggregatorV3Interface internal WBtcPriceFeed;
    AggregatorV3Interface internal ethUsdPriceFeed;
    // AggregatorV3Interface internal WEthPriceFeed; only need WBtc

    // Mainnet Addresses
    address private constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address private constant WBTC = 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599;

    // Testnet Goerli Adresses
    // address private constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    // address private constant WBTC = 0xdA4a47eDf8ab3c5EeeB537A97c5B66eA42F49CdA;

    IAToken[] private _vaultTokens;
    uint256 public ethUsdPrice;
    uint256 public btcUsdPrice;
    uint256 public indexValueUSD; // get eth to usd conversion rate
    uint256 public indexValue; // index value quoted in eth
    uint256 public wethOnContract;
    uint256 public aWethOnContract;
    uint256 public wbtcOnContract;
    uint256 public aWbtcOnContractValue;
    uint256 public aWbtcOnContract;
    uint256 public withdrawalTokenValue;

    // @xm3van: let's denominate in wei for sake of consistency
    mapping(address => uint256) public addressToAmountFunded; // maps address to how much they have funded the index with - remove - user's token balance proportional to their funding!
    // actually keep - we can then calculate the profit of the position and take a performance fee.
    mapping(address => uint256) public tokenIndexValues; // maps token address to value (in eth) of that token in the index
    mapping(address => address) public VaultTokenToToken; // maps aToken address to corresponding token address.
    // mapping(address => uint256) public tokenIndexProportion; // input: token address, output what proportion of total fund value is from the token.
    uint256 public inverseIndexProportionBTCx100;
    // Define Events
    event liquidtyRemoved(uint256 amount);

    constructor(
        address _tokenContract,
        address[] memory vaultTokens,
        // put in btc first!
        address[] memory tokens
    ) {
        // read in provided vault token addresses
        for (uint8 i = 0; i < _vaultTokens.length; i++) {
            _vaultTokens[i] = IAToken(vaultTokens[i]);
        }
        // use interfaces to allow use of token functions
        tokenContract = IIndexToken(_tokenContract);

        // weth contract
        wethContract = IWETH(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);
        //wbtc contract
        wbtcContract = IWETH(0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599);

        // aToken initialisations
        aWBtcContract = IAToken(0x9ff58f4fFB29fA2266Ab25e75e2A8b3503311656);
        aWethContract = IAToken(0x030bA81f1c18d280636F32af80b9AAd02Cf0854e);

        // Aave v2 lending pool contract
        aaveV2LendingPool = ILendingPool(
            0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9
        );

        //Btc/Eth price feed
        WBtcPriceFeed = AggregatorV3Interface(
            0xdeb288F737066589598e9214E782fa5A8eD689e8 // Mainnet address
            // 0x779877A7B0D9E8603169DdbD7836e478b4624789 // Groeli testnet address
        );

        ethUsdPriceFeed = AggregatorV3Interface(
            0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419
        );

        // map vault tokens to underlying - careful of order!
        // think not needed as we can call function from IAToken interface to get this data
        // for (uint8 i = 0; i < tokens.length; i++) {
        //     VaultTokenToToken[_vaultTokens[i]] = tokens[i];
        // }
    }

    /// FUNCTIONALITY DEPOSIT

    function receive_funds() public payable {
        // allows users to send eth to the contract.
        // on doing so should mint tokens proportionate to eth added compared to
        // value of fund.

        /// @dev: require stament to prevent unreasonale small contribution extending
        /// decimals beyond reason.
        require(
            msg.value > 100000000000000000 wei,
            "Please increase the minimum contribution to 0.1 Ether!"
        );

        convertToWeth();

        //calculate number of index tokens to mint
        uint256 tokensToMint = calculateTokensToMint(msg.value); //double check logic

        //mint tokens
        tokenContract.mint(msg.sender, tokensToMint);

        // convert all eth idle in contract to weth
        //
    }

    //@xm3van:  anxilary function
    function getWbtcPrice() public view returns (uint256 wbtcPrice) {
        // returns price of btc in eth as a BN (ie ~13*10^18)
        (, int256 price, , , ) = WBtcPriceFeed.latestRoundData();
        return uint256(price);
    }

    function getEthPrice() public view returns (uint256 ethPrice) {
        // returns ETH/USD price as price *10**8 (dont ask me why)
        (, int256 price, , , ) = ethUsdPriceFeed.latestRoundData();
        ethPrice = uint256(price);
        return (ethPrice);
    }

    function calculateTokensToMint(uint256 _ethReceived)
        internal
        returns (uint256 tokensToMint)
    {
        if (tokenContract.totalSupply() == 0) {
            // if no tokens minted, mint 1 token for each unit of eth received
            // sets index token = 1 eth at start
            indexValue += _ethReceived;
            indexValueUSD = (indexValue * getEthPrice()) / 10**8;
            return (_ethReceived);
        } else {
            // adding eth to the index returns
            uint256 currentTokenSupply = tokenContract.totalSupply();
            (uint256 currentIndexValue, ) = calculateIndexValue();
            uint256 indexValueBeforeDeposit = currentIndexValue - _ethReceived;
            uint256 toMint = (currentTokenSupply * _ethReceived) /
                indexValueBeforeDeposit;
            updateIndexValueUSD();
            return (toMint);
        }
    }

    function updateIndexValueUSD() public {
        // call this to update index value in USD (will also update in eth terms)
        (indexValue, ) = calculateIndexValue();
        indexValueUSD = (indexValue * getEthPrice()) / 10**8;
    }

    function wethBalance() public view returns (uint256 _balance) {
        _balance = wethContract.balanceOf(address(this));
        return _balance;
    }

    function updateAwbtcOnContractValue() public {
        aWbtcOnContractValue = (aWbtcOnContract * getWbtcPrice()) / (10**8); // divide by btc decimals
    }

    function calculateIndexValue()
        public
        returns (uint256 valueOfIndex, uint256 valueOfVaultPositions)
    {
        uint256 wethOwnedByContract = wethBalance();
        // console.log("weth on contract: %s", wethOwnedByContract);
        aWbtcOnContract = aWBtcContract.balanceOf(address(this));
        // console.log("awbtc on contract: %s", aWbtcOnContract);
        updateAwbtcOnContractValue();
        console.log("awbtc on contract value: %s", aWbtcOnContractValue);
        aWethOnContract = aWethContract.balanceOf(address(this));
        console.log(
            "aweth on contract (from 'calculateIndexValue'): %s",
            aWethOnContract
        );

        uint256 totalVaultPositionsValue = aWethOnContract +
            aWbtcOnContractValue;
        valueOfIndex = totalVaultPositionsValue + wethOwnedByContract;
        indexValueUSD = (indexValue * getEthPrice()) / 10**8;
        return (valueOfIndex, totalVaultPositionsValue);
    }

    //@xm3van:  anxilary function
    // @leo old version - would be nice to use mappings etc (esp. for larger indexes)
    // function calculateIndexValue()
    //     public
    //     view
    //     returns (uint256 valueOfIndex, uint256 valueOfVaultPositions)
    // {
    //     // index value is sum of eth on contract and eth value of deposited tokens
    //     // uint256 ethOnContract = address(this).balance;
    //     uint256 wethOwnedByContract = wethBalance();
    //     uint256 totalVaultPositionsValue;
    //     for (uint8 i = 0; i < _vaultTokens.length; i++) {
    //         totalVaultPositionsValue += getDepositedValue(_vaultTokens[i]);
    //     }
    //     valueOfIndex = totalVaultPositionsValue + wethOwnedByContract;
    //     return (valueOfIndex, totalVaultPositionsValue);
    // }

    // //@xm3van:  anxilary function
    // function getDepositedValue(IAToken aTokenContract)
    //     public
    //     view
    //     returns (uint256 positionValue)
    // {
    //     // aTokens pegged 1:1 to underlying
    //     // get balance of aTokens within indexContract
    //     uint256 balanceOfVaultTokenInIndex = aTokenContract.balanceOf(
    //         address(this)
    //     );
    //     // get price per vault token
    //     uint256 priceOfVaultToken;
    //     if (aTokenContract == _vaultTokens[1]) {
    //         // if asset is eth, return 1: 1eth = 1eth
    //         priceOfVaultToken = 1;
    //     } else {
    //         priceOfVaultToken = getWbtcPrice();
    //         // (, priceOfVaultToken, , , ) = WBtcPriceFeed.latestRoundData();
    //     }

    //     return (uint256(priceOfVaultToken) * balanceOfVaultTokenInIndex);
    // } // CHECK updateTokenProportionsAndReturnMaxLoc() FUNCTION AFTER WRITING THIS

    //@xm3van:  Rebalance function
    function swap(
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn,
        uint256 _amountOutMin,
        address _to
    ) public {
        //first we need to transfer the amount in tokens from the msg.sender to this contract
        //this contract will have the amount of in tokens
        // IERC20(_tokenIn).transferFrom(msg.sender, address(this), _amountIn);

        //next we need to allow the uniswapv2 router to spend the token we just sent to this contract
        //by calling IERC20 approve you allow the uniswap contract to spend the tokens in this contract
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

    /// FUNCTIONALITY REBALANCE
    function convertToWeth() public {
        //public for testing - should be internal
        uint256 eth = address(this).balance;
        wethContract.deposit{value: eth}();
        uint256 wethBal = wethContract.balanceOf(address(this));
        wethContract.transfer(address(this), wethBal);
        // update global weth on contract
        wethOnContract = wethContract.balanceOf(address(this));
    }

    function depositToAave(address token, uint256 amount) public {
        aaveV2LendingPool.deposit(token, amount, address(this), 0);
    }

    function balanceFund() public {
        // check for any vault positions
        console.log("balancing fund");
        (, uint256 vaultValue) = calculateIndexValue();
        console.log("vault value: %s", vaultValue);
        if (vaultValue == 0) {
            // if vault value is zero ie all balance is just held as eth on contract
            // convert ETH to WETH
            // convertToWeth();
            // swap half eth for btc
            wethOnContract = wethContract.balanceOf(address(this));
            uint256 wethToSwap = wethOnContract / 2;
            uint256 minAmountOut = getAmountOutMin(WETH, WBTC, wethToSwap);
            swap(WETH, WBTC, wethToSwap, minAmountOut, address(this));
            wbtcOnContract = wbtcContract.balanceOf(address(this));
            // approve spending of weth and wbtc (max fine)
            wethContract.approve(address(aaveV2LendingPool), 2**256 - 1);
            wbtcContract.approve(address(aaveV2LendingPool), 2**256 - 1);
            // deposit both to aave vaults
            aaveV2LendingPool.deposit(WETH, wethToSwap, address(this), 0);
            aaveV2LendingPool.deposit(WBTC, wbtcOnContract, address(this), 0);

            // update awToken holdings
            console.log("line 423 index contract");
            updateHoldings();
        } else {
            // console.log("rebalancing existing vault");
            // vault value not zero
            rebalanceExistingVault();
        }
    }

    function updateHoldings() public {
        aWethOnContract = aWethContract.balanceOf(address(this));
        aWbtcOnContract = aWBtcContract.balanceOf(address(this)); // consider making this global
        wethOnContract = wethContract.balanceOf(address(this));
        updateAwbtcOnContractValue();
        console.log("weth on contract: %s", wethOnContract);
        console.log("aWeth on contract: %s", aWethOnContract);
        console.log("aWbtc on contract: %s", aWbtcOnContract);
        console.log("aWbtc on contract value : %s", aWbtcOnContractValue);
    }

    function rebalanceEthHeavy() public {
        // should be private / restricted
        // check for weth on contract
        wethOnContract = wethContract.balanceOf(address(this));
        console.log("rebalancing eth heavy");
        // IAToken public aWethContract;
        // IAToken public aWBtcContract;
        updateAwbtcOnContractValue();
        // check the difference in values
        uint256 indexValueDifference = aWethOnContract - aWbtcOnContractValue;

        if (wethOnContract > 1) {
            // only bother swapping and depositing weth if > 1 on contract
            if (wethOnContract <= indexValueDifference) {
                // swap all to contractToBuy and deposit to try and reblance this way
                uint256 minAmountOut = getAmountOutMin(
                    WETH,
                    WBTC,
                    wethOnContract
                );
                swap(WETH, WBTC, wethOnContract, minAmountOut, address(this));
                wbtcOnContract = wbtcContract.balanceOf(address(this));
                // deposit wbtc on contract to aave
                aaveV2LendingPool.deposit(
                    WBTC,
                    wbtcOnContract,
                    address(this),
                    0
                );
                // update awToken holdings
                console.log("line 433 index contract");
                updateHoldings();
                // RECURSION - not meant to do but think it's the best option here
                // will recalculate difference and go into unstaking, swapping and restaking routine
                // might not work
                this.rebalanceExistingVault();
            } else {
                // amount of weth on contract is enough to balance with some extra
                // weth to swap is difference in values + half of remaining weth
                // maybe check spare eth > threhsold (1) eth amount
                console.log("line 441");
                uint256 excessWeth = wethOnContract - indexValueDifference;
                uint256 wethToSwapToBtc = indexValueDifference +
                    (excessWeth / 2);
                // do swap from weth to wbtc
                uint256 minAmountOut = getAmountOutMin(
                    WETH,
                    WBTC,
                    wethToSwapToBtc
                );
                swap(WETH, WBTC, wethToSwapToBtc, minAmountOut, address(this));
                // get weth and btc holdings in contract
                wethOnContract = wethContract.balanceOf(address(this));
                // wethOnContract = (excessWeth / 2)
                wbtcOnContract = wbtcContract.balanceOf(address(this));
                // deposit both to aave
                aaveV2LendingPool.deposit(
                    WETH,
                    wethOnContract,
                    address(this),
                    0
                );
                aaveV2LendingPool.deposit(
                    WBTC,
                    wbtcOnContract,
                    address(this),
                    0
                );
                console.log("line 469");
                // update awToken holdings
                updateHoldings();
            }
        } else {
            // no spare weth on contract so must remove weth from aave, swap and deposit btc.
            uint256 halfDifference = indexValueDifference / 2;
            // remove half difference amount from aave
            aaveV2LendingPool.withdraw(WETH, halfDifference, address(this));
            // now we have WETH on contract
            wethOnContract = wethContract.balanceOf(address(this));
            // swap WETH on contract (incl. dust (amount < 1)) to WBTC
            uint256 minAmountOut = getAmountOutMin(WETH, WBTC, wethOnContract);
            swap(WETH, WBTC, wethOnContract, minAmountOut, address(this));
            // now we have WBTC on contract
            wbtcOnContract = wbtcContract.balanceOf(address(this));
            // deposit to aave
            aaveV2LendingPool.deposit(WBTC, wbtcOnContract, address(this), 0);
            console.log("line 433 index contract");
            updateHoldings();
        }
    }

    function rebalanceExistingVault() public {
        console.log("rebalancing existing vault");
        // calculate values of aWETH and aWBTC on contract
        // updateHoldings();

        uint256 totalAtokenValueOnContract = aWbtcOnContractValue +
            aWethOnContract;
        // check if rebalance required
        inverseIndexProportionBTCx100 =
            (100 * totalAtokenValueOnContract) /
            aWbtcOnContractValue;

        if (inverseIndexProportionBTCx100 > 210) {
            console.log("index is eth heavy!");
            // corresponds to eth appreciating ~ 2.5% relative to BTC
            // this means there is more value of aweth on contract than awbtc
            rebalanceEthHeavy();
        } else if (inverseIndexProportionBTCx100 < 190) {
            // corresponds to btc appreciating ~ 2.5% relative to eth
            // this means there is more value of awbtc on contract than aweth
            //rebalanceBtcHeavy();
        } else {
            console.log("no rebalance required"); // remove this else statement when happy with functionality
        }
    }

    /// FUNCTONALITY WITHDRAW
    // 0. require user has balance
    // 1. Calucate worth of user index tokens #DONE
    // 2. do a proportional withdrawal #DONE
    //  --> wbtc - pool
    //  --> weth - pool
    // 3. convert btc -> weth #DONE
    // 4. convert to weth to eth #DONE
    // 5. burn tokens
    // 6. return eth

    // @xm3van: Still needs some partial unit testing!!!

    // @xm3van: Withdraw function & tested!
    function unwrapEth(uint256 Amount) public payable {
        require(Amount > 0, "Please increase the minimum Amount to unwrap!");
        wethContract.withdraw(Amount);
    }

    //@xm3van:  withdraw function
    function burnIndexTokens(uint256 amount) public {
        tokenContract.burn(amount);
    }

    //@xm3van:  withdraw function
    function returnEth(uint256 amount) public {
        payable(msg.sender).transfer(amount);
    }

    // @xm3van: Withdraw function & tested!
    // function calculateIndexTokensValue(uint256 indexTokenAmount)
    //     public
    //     returns (uint256 indexTokenAmountValue)
    // {
    //     /// Purpose of this function is to calculate the value of a
    //     /// given amount of indexToken

    //     // Value of token's send by user
    //     (uint256 indval, ) = calculateIndexValue();
    //     uint256 indVal = (indval / 10**18);
    //     uint256 tokenSupply = (tokenContract.totalSupply() / 10**18);
    //     uint256 iTokenVal = ((indexTokenAmount / 10**18));

    //     console.log("indVal: %s", indVal);
    //     console.log("tokenSupply: %s", tokenSupply);
    //     console.log("indexTokenAmount: %s", iTokenVal);

    //     // value
    //     // @xm3van: Is this safe? It should be as SafeMath is implemented right?
    //     withdrawalTokenValue =
    //         (((indVal * iTokenVal) * 10**8) / tokenSupply) *
    //         10**10;

    //     console.log("withdrawalTokenValue: %s", withdrawalTokenValue);

    //     // returns
    //     return withdrawalTokenValue;
    // }

    function withdraw(uint256 tokenAmount) public {
        // @xm3van: decided to not implement require function as the user will carry gas cost
        // i.e. they can rebalance as much as they like, right?
        // require(calculateIndexTokensValue(amount)>1, "Please ensure your token's are worth more than 1 ETH");
        uint256 userTokenBalance = tokenContract.balanceOf(msg.sender);
        console.log("user token balance: %s", userTokenBalance);
        require(
            tokenAmount <= userTokenBalance,
            "cannot redeem more tokens than you own!"
        );
        // allow contract to spend index toknes( for burn)
        // tokenContract.approve(address(this), tokenAmount);

        // calculates user value
        uint256 valueUserIndexToken = calculateIndexTokensValue(tokenAmount);

        // remove's 50%  from aave
        uint256 halfDifference = valueUserIndexToken / 2;
        console.log("HalfDifference = %s", halfDifference);
        uint256 halfDifferenceETH = halfDifference / (10**18);
        console.log("HalfDifference in ETH = %s", halfDifferenceETH);
        uint256 wbtcHalfDifferenceNew = (halfDifference * getWbtcPrice()) / (10**18);
        console.log("WbtcHalfDifferenceNew: ", wbtcHalfDifferenceNew);

        // calculate halfdifference in terms of WBTC
        // getWbtcPrice() gives price of BTC in ETH!
        uint256 wbtcHalfDifference = (halfDifference * 10**8) / getWbtcPrice();
        uint256 wbtcHalfDifferenceETH = wbtcHalfDifference / (10**18);


        uint256 wbtcPrice = getWbtcPrice() / (10**18);
        console.log("wbtcPrice in ETH: ", wbtcPrice);
        console.log("wbtcHalfDifference Wrong? = %s", wbtcHalfDifference);
        console.log("wbtcHalfDifference in ETH Wrong? = %s", wbtcHalfDifferenceETH);
        // remove half difference value from aave from wbtc
        aaveV2LendingPool.withdraw(WBTC, wbtcHalfDifference, address(this));
        console.log("WBTC withdrawal from aave completed!");
        // swap WBTC on contract to WETH
        uint256 minAmountOut = getAmountOutMin(WBTC, WETH, wbtcHalfDifference);
        swap(WBTC, WETH, wbtcHalfDifference, minAmountOut, address(this));
        console.log("swap completed");
        console.log("Half Difference: ");
        console.log(halfDifference);
        console.log("weth on Contract: ");
        console.log(wethOnContract);

        console.log("Withdraw halfDifference - wethOnContract");
        // remove (halfdifference - weth on contract) from aave
        // remove half difference amount from aave from weth

        

        aaveV2LendingPool.withdraw(
            WETH,
            (halfDifference),
            address(this)
        );
        console.log("WETH withdrawal from aave completed!");

        // Unwrap WETH
        // uint256 wethToUnwrap = minAmountOut + halfDifference;
        // unwrapEth(wethToUnwrap);
        // console.log("Weth unwrapped");
        console.log(msg.sender);
        console.log("attempting burn: %s", tokenAmount);
        tokenContract.burnFrom(msg.sender, tokenAmount);

        // burn index tokens
        // tokenContract.burn(tokenAmount);
        console.log("index tokens burnt");

        //return eth
        // payable(msg.sender).transfer(wethToUnwrap);
        // console.log("eth transferred back to user");

        uint256 wethToUnwrap = minAmountOut + halfDifference;
        returnWeth(wethToUnwrap);
        console.log("weth transferred back to user");
        updateIndexValueUSD();
    }

    // @xm3van: Withdraw function & tested!
    function calculateIndexTokensValue(uint256 indexTokenAmount)
        public
        returns (uint256 indexTokenAmountValue)
    {
        /// Purpose of this function is to calculate the value of a
        /// given amount of indexToken

        // Value of token's send by user
        // (indexValue, ) = calculateIndexValue();
        updateIndexValueUSD();
        uint256 tokenSupply = tokenContract.totalSupply();

        // value
        // @xm3van: Is this safe? It should be as SafeMath is implemented right?
        // @Leo: would recommend multiplying first ie:
        withdrawalTokenValue = (indexValue * indexTokenAmount) / tokenSupply;
        // withdrawalTokenValue = (indexValue / tokenSupply) * indexTokenAmount;

        // returns

        return (withdrawalTokenValue);
    }

    // @xm3van: Withdraw function & tested!
    // function unwrapEth(uint256 Amount) public payable {
    //     require(Amount > 0, "Please increase the minimum Amount to unwrap!");
    //     wethContract.withdraw(Amount);
    // }

    //@xm3van:  withdraw function
    // dont think we need - function specified on erc20Burnable
    // function burnIndexTokens(uint256 amount) public {
    //     tokenContract.burn(amount);
    // }

    //@xm3van:  withdraw function
    // function returnEth(uint256 amount) public {
    //     payable(msg.sender).transfer(amount);
    // }

    function returnWeth(uint256 amount) public {
        wethContract.transfer(msg.sender, amount);
    }
    // //@xm3van:  withdraw function
    // function returnIndexTokens(uint256 amount) public {
    //     // function to facilitate return of Index Tokens to Index contract. Will be part of 'remove Liquidity' functionality
    //     require(amount > 0, "You need to return at least some tokens");
    //     uint256 allowance = tokenContract.allowance(msg.sender, address(this));
    //     require(allowance >= amount, "Check the token allowance");
    //     tokenContract.transferFrom(msg.sender, address(this), amount);
    // }

    // //@xm3van:  withdraw function
    // function removeLiquidity(uint256 amount) public {
    //     // # user sends index tokens back to contract
    //     require(amount > 0, "Provide amount of liquidity to remove");
    //     // get allowance for this
    //     // @xm3van What is the rational for allowance? Time locking contribution to pools? Else Allowance = tokenbalance
    //     uint256 allowance = tokenContract.allowance(msg.sender, address(this));
    //     require(allowance >= amount, "check token allowance");
    //     // burn index tokens straight from user wallet
    //     tokenContract.burn(msg.sender, amount);
    //     // #call token balancing function to decide where best to remove tokens from
    //     emit liquidtyRemoved(amount);

    //     // getIndexBalance()
    //     // get number of tokens belonging to this address in a vault.
    //     // unstake tokens
    //     // switch tokens to eth (if required)
    //     // send eth back to function caller (msg.sender)
    //     // payable(msg.sender).transfer(amount); //typecast 'payable' to msg.sender
    // }

    /// ANXILIARY FUNCTIONS
    //@xm3van:  anxilary function
    // function wethBalance() public view returns (uint256 _balance) {
    //     _balance = wethContract.balanceOf(address(this));
    //     return _balance;
    // }

    //@xm3van:  anxilary function
    // function convertToWeth() public payable {
    //     uint256 eth = address(this).balance;
    //     wethContract.deposit{value: eth}();
    //     uint256 wethBal = wethContract.balanceOf(address(this));
    //     wethContract.transfer(address(this), wethBal);
    // }

    // Ref.: https://ethereum.stackexchange.com/questions/136296/how-to-deposit-and-withdraw-weth

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

    // function calculatePoolValue() public returns (uint256 _poolValue) {
    //     // function to calculate pool value, denominated in eth.
    //     // get conversion from uni pools or chainlink(preferred)
    // }

    // Ref.: https://ethereum.stackexchange.com/questions/136296/how-to-deposit-and-withdraw-weth

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

    //CHECK THIS AFTER 'getDepositedValue' Written

    // function updateTokenProportionsAndReturnMaxLoc()
    //     public
    //     returns (uint8 maxIndex)
    // {
    //     uint8 maxAt = 0;
    //     if (indexValue > 0) {
    //         for (uint8 i = 0; i < _vaultTokens.length; i++) {
    //             vaultToken = _vaultTokens[i];
    //             address underlyingTokenAddress = VaultTokenToToken[vaultToken];

    //             tokenIndexProportion[underlyingTokenAddress] =
    //                 tokenIndexValues[underlyingTokenAddress] /
    //                 indexValue;
    //             if (
    //                 i > 0 &&
    //                 tokenIndexProportion[underlyingTokenAddress] >
    //                 tokenIndexProportion[VaultTokenToToken[_vaultTokens[i - 1]]]
    //             ) {
    //                 maxAt = i;
    //             }
    //         }
    //     } else {
    //         maxAt = 4; // maxAt = 4 means index value = 0 - instruct purchases of tokens
    //     }
    //     // return index of largest proportion - need to sell this first before
    //     // attempting to buy other tokens
    //     return (maxAt);
    // }

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
