// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title RevyFeeCollector
 * @notice Collects and distributes protocol fees from the RevyRouter.
 * @dev Fee distribution:
 *   - 70% to stakers (transferred to staking contract)
 *   - 20% to treasury (development, audits, infrastructure)
 *   - 10% buyback and burn
 */
contract RevyFeeCollector is Ownable {
    using SafeERC20 for IERC20;

    /// @notice The staking contract that receives 70% of fees.
    address public stakingContract;

    /// @notice The treasury address that receives 20% of fees.
    address public treasury;

    /// @notice The buyback contract that receives 10% of fees.
    address public buybackContract;

    /// @notice Distribution ratios in basis points (must sum to 10000).
    uint256 public stakingRatioBps = 7000;
    uint256 public treasuryRatioBps = 2000;
    uint256 public buybackRatioBps = 1000;

    /// @notice Total native fees distributed.
    uint256 public totalNativeDistributed;

    /// @notice Total token fees distributed per token address.
    mapping(address => uint256) public totalTokenDistributed;

    /// @notice Emitted when fees are distributed.
    event FeesDistributed(
        address indexed token,
        uint256 totalAmount,
        uint256 stakingAmount,
        uint256 treasuryAmount,
        uint256 buybackAmount
    );

    /// @notice Emitted when distribution ratios are updated.
    event RatiosUpdated(
        uint256 stakingBps,
        uint256 treasuryBps,
        uint256 buybackBps
    );

    /// @notice Emitted when a recipient address is updated.
    event RecipientUpdated(string role, address oldAddress, address newAddress);

    error InvalidRatios();
    error ZeroAddress();
    error NoFeesToDistribute();
    error TransferFailed();

    constructor(
        address _staking,
        address _treasury,
        address _buyback
    ) Ownable(msg.sender) {
        if (_staking == address(0) || _treasury == address(0) || _buyback == address(0)) {
            revert ZeroAddress();
        }
        stakingContract = _staking;
        treasury = _treasury;
        buybackContract = _buyback;
    }

    /// @notice Receive native token fees from the router.
    receive() external payable {}

    /// @notice Distribute accumulated native token fees.
    function distributeNative() external {
        uint256 balance = address(this).balance;
        if (balance == 0) revert NoFeesToDistribute();

        uint256 stakingAmount = (balance * stakingRatioBps) / 10000;
        uint256 treasuryAmount = (balance * treasuryRatioBps) / 10000;
        uint256 buybackAmount = balance - stakingAmount - treasuryAmount;

        totalNativeDistributed += balance;

        (bool s1, ) = stakingContract.call{value: stakingAmount}("");
        if (!s1) revert TransferFailed();

        (bool s2, ) = treasury.call{value: treasuryAmount}("");
        if (!s2) revert TransferFailed();

        (bool s3, ) = buybackContract.call{value: buybackAmount}("");
        if (!s3) revert TransferFailed();

        emit FeesDistributed(
            address(0),
            balance,
            stakingAmount,
            treasuryAmount,
            buybackAmount
        );
    }

    /// @notice Distribute accumulated ERC-20 token fees.
    /// @param _token The token address to distribute.
    function distributeToken(address _token) external {
        uint256 balance = IERC20(_token).balanceOf(address(this));
        if (balance == 0) revert NoFeesToDistribute();

        uint256 stakingAmount = (balance * stakingRatioBps) / 10000;
        uint256 treasuryAmount = (balance * treasuryRatioBps) / 10000;
        uint256 buybackAmount = balance - stakingAmount - treasuryAmount;

        totalTokenDistributed[_token] += balance;

        IERC20(_token).safeTransfer(stakingContract, stakingAmount);
        IERC20(_token).safeTransfer(treasury, treasuryAmount);
        IERC20(_token).safeTransfer(buybackContract, buybackAmount);

        emit FeesDistributed(
            _token,
            balance,
            stakingAmount,
            treasuryAmount,
            buybackAmount
        );
    }

    /// @notice Update distribution ratios.
    /// @param _stakingBps Staking ratio in basis points.
    /// @param _treasuryBps Treasury ratio in basis points.
    /// @param _buybackBps Buyback ratio in basis points.
    function setRatios(
        uint256 _stakingBps,
        uint256 _treasuryBps,
        uint256 _buybackBps
    ) external onlyOwner {
        if (_stakingBps + _treasuryBps + _buybackBps != 10000) {
            revert InvalidRatios();
        }

        stakingRatioBps = _stakingBps;
        treasuryRatioBps = _treasuryBps;
        buybackRatioBps = _buybackBps;

        emit RatiosUpdated(_stakingBps, _treasuryBps, _buybackBps);
    }

    /// @notice Update the staking contract address.
    /// @param _staking The new staking contract address.
    function setStakingContract(address _staking) external onlyOwner {
        if (_staking == address(0)) revert ZeroAddress();
        address old = stakingContract;
        stakingContract = _staking;
        emit RecipientUpdated("staking", old, _staking);
    }

    /// @notice Update the treasury address.
    /// @param _treasury The new treasury address.
    function setTreasury(address _treasury) external onlyOwner {
        if (_treasury == address(0)) revert ZeroAddress();
        address old = treasury;
        treasury = _treasury;
        emit RecipientUpdated("treasury", old, _treasury);
    }

    /// @notice Update the buyback contract address.
    /// @param _buyback The new buyback contract address.
    function setBuybackContract(address _buyback) external onlyOwner {
        if (_buyback == address(0)) revert ZeroAddress();
        address old = buybackContract;
        buybackContract = _buyback;
        emit RecipientUpdated("buyback", old, _buyback);
    }

    /// @notice Emergency rescue for stuck native tokens.
    function rescueNative() external onlyOwner {
        (bool success, ) = owner().call{value: address(this).balance}("");
        if (!success) revert TransferFailed();
    }

    /// @notice Emergency rescue for stuck ERC-20 tokens.
    /// @param _token The token address to rescue.
    function rescueToken(address _token) external onlyOwner {
        uint256 balance = IERC20(_token).balanceOf(address(this));
        IERC20(_token).safeTransfer(owner(), balance);
    }
}
