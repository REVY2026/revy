// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title RevyStaking
 * @notice Stake $REVY tokens to earn protocol fee rewards.
 * @dev Rewards are distributed proportionally to staked amounts.
 *      Stakers receive 70% of all protocol fees routed through RevyRouter.
 */
contract RevyStaking is Ownable {
    using SafeERC20 for IERC20;

    /// @notice The REVY token contract.
    IERC20 public immutable revyToken;

    /// @notice Total REVY tokens currently staked.
    uint256 public totalStaked;

    /// @notice Accumulated reward per token (scaled by 1e18).
    uint256 public rewardPerTokenStored;

    /// @notice Mapping of staker address to their staked amount.
    mapping(address => uint256) public stakedBalance;

    /// @notice Mapping of staker address to their paid reward per token.
    mapping(address => uint256) public userRewardPerTokenPaid;

    /// @notice Mapping of staker address to their pending rewards.
    mapping(address => uint256) public pendingRewards;

    /// @notice Total rewards distributed to date.
    uint256 public totalRewardsDistributed;

    /// @notice Minimum stake amount (prevents dust attacks).
    uint256 public minStakeAmount = 100 * 1e18;

    /// @notice Cooldown period after staking before unstake is allowed.
    uint256 public cooldownPeriod = 7 days;

    /// @notice Mapping of staker to their last stake timestamp.
    mapping(address => uint256) public lastStakeTime;

    /// @notice Emitted when tokens are staked.
    event Staked(address indexed user, uint256 amount);

    /// @notice Emitted when tokens are unstaked.
    event Unstaked(address indexed user, uint256 amount);

    /// @notice Emitted when rewards are claimed.
    event RewardClaimed(address indexed user, uint256 amount);

    /// @notice Emitted when new rewards are added to the pool.
    event RewardAdded(uint256 amount);

    error InsufficientStake();
    error CooldownNotMet();
    error InsufficientBalance();
    error ZeroAmount();

    constructor(address _revyToken) Ownable(msg.sender) {
        revyToken = IERC20(_revyToken);
    }

    /// @notice Receive native tokens as rewards from FeeCollector.
    receive() external payable {
        if (totalStaked > 0) {
            rewardPerTokenStored += (msg.value * 1e18) / totalStaked;
        }
        totalRewardsDistributed += msg.value;
        emit RewardAdded(msg.value);
    }

    /// @notice Get the current earned rewards for a staker.
    /// @param _user The staker address.
    /// @return The amount of pending rewards in wei.
    function earned(address _user) public view returns (uint256) {
        uint256 balance = stakedBalance[_user];
        uint256 rewardDelta = rewardPerTokenStored - userRewardPerTokenPaid[_user];
        return pendingRewards[_user] + (balance * rewardDelta) / 1e18;
    }

    /// @dev Update reward state for a user before any stake/unstake/claim action.
    modifier updateReward(address _user) {
        if (_user != address(0)) {
            pendingRewards[_user] = earned(_user);
            userRewardPerTokenPaid[_user] = rewardPerTokenStored;
        }
        _;
    }

    /// @notice Stake REVY tokens.
    /// @param _amount The amount of REVY tokens to stake.
    function stake(uint256 _amount) external updateReward(msg.sender) {
        if (_amount == 0) revert ZeroAmount();
        if (_amount < minStakeAmount && stakedBalance[msg.sender] == 0) {
            revert InsufficientStake();
        }

        revyToken.safeTransferFrom(msg.sender, address(this), _amount);

        stakedBalance[msg.sender] += _amount;
        totalStaked += _amount;
        lastStakeTime[msg.sender] = block.timestamp;

        emit Staked(msg.sender, _amount);
    }

    /// @notice Unstake REVY tokens.
    /// @param _amount The amount of REVY tokens to unstake.
    function unstake(uint256 _amount) external updateReward(msg.sender) {
        if (_amount == 0) revert ZeroAmount();
        if (_amount > stakedBalance[msg.sender]) revert InsufficientBalance();
        if (block.timestamp < lastStakeTime[msg.sender] + cooldownPeriod) {
            revert CooldownNotMet();
        }

        stakedBalance[msg.sender] -= _amount;
        totalStaked -= _amount;

        revyToken.safeTransfer(msg.sender, _amount);

        emit Unstaked(msg.sender, _amount);
    }

    /// @notice Claim accumulated rewards.
    function claimRewards() external updateReward(msg.sender) {
        uint256 reward = pendingRewards[msg.sender];
        if (reward == 0) revert ZeroAmount();

        pendingRewards[msg.sender] = 0;

        (bool success, ) = msg.sender.call{value: reward}("");
        require(success, "Transfer failed");

        emit RewardClaimed(msg.sender, reward);
    }

    /// @notice Stake and claim in one transaction.
    /// @param _amount The amount of REVY tokens to stake.
    function stakeAndClaim(uint256 _amount) external updateReward(msg.sender) {
        // Claim first
        uint256 reward = pendingRewards[msg.sender];
        if (reward > 0) {
            pendingRewards[msg.sender] = 0;
            (bool success, ) = msg.sender.call{value: reward}("");
            require(success, "Transfer failed");
            emit RewardClaimed(msg.sender, reward);
        }

        // Then stake
        if (_amount > 0) {
            revyToken.safeTransferFrom(msg.sender, address(this), _amount);
            stakedBalance[msg.sender] += _amount;
            totalStaked += _amount;
            lastStakeTime[msg.sender] = block.timestamp;
            emit Staked(msg.sender, _amount);
        }
    }

    /// @notice Update the minimum stake amount.
    /// @param _minAmount The new minimum stake amount.
    function setMinStakeAmount(uint256 _minAmount) external onlyOwner {
        minStakeAmount = _minAmount;
    }

    /// @notice Update the cooldown period.
    /// @param _period The new cooldown period in seconds.
    function setCooldownPeriod(uint256 _period) external onlyOwner {
        cooldownPeriod = _period;
    }

    /// @notice Emergency rescue for stuck tokens (not REVY).
    /// @param _token The token address to rescue.
    function rescueToken(address _token) external onlyOwner {
        require(_token != address(revyToken), "Cannot rescue staked token");
        uint256 balance = IERC20(_token).balanceOf(address(this));
        IERC20(_token).safeTransfer(owner(), balance);
    }

    /// @notice Get staking info for a user.
    /// @param _user The staker address.
    /// @return staked The amount staked.
    /// @return rewards The pending rewards.
    /// @return canUnstake Whether the cooldown has passed.
    function getUserInfo(address _user) external view returns (
        uint256 staked,
        uint256 rewards,
        bool canUnstake
    ) {
        staked = stakedBalance[_user];
        rewards = earned(_user);
        canUnstake = block.timestamp >= lastStakeTime[_user] + cooldownPeriod;
    }
}
