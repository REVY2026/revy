// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IRevyStaking
 * @notice Interface for the Revy staking contract.
 * @dev Stakers earn proportional protocol fee rewards.
 */
interface IRevyStaking {
    /// @notice Emitted when tokens are staked.
    event Staked(address indexed user, uint256 amount);

    /// @notice Emitted when tokens are unstaked.
    event Unstaked(address indexed user, uint256 amount);

    /// @notice Emitted when rewards are claimed.
    event RewardClaimed(address indexed user, uint256 amount);

    /// @notice Emitted when new rewards are added.
    event RewardAdded(uint256 amount);

    /// @notice Stake REVY tokens.
    /// @param amount The amount to stake.
    function stake(uint256 amount) external;

    /// @notice Unstake REVY tokens.
    /// @param amount The amount to unstake.
    function unstake(uint256 amount) external;

    /// @notice Claim accumulated rewards.
    function claimRewards() external;

    /// @notice Stake and claim in one transaction.
    /// @param amount The amount to additionally stake.
    function stakeAndClaim(uint256 amount) external;

    /// @notice Get earned rewards for a user.
    /// @param user The user address.
    /// @return The pending reward amount.
    function earned(address user) external view returns (uint256);

    /// @notice Get staked balance for a user.
    /// @param user The user address.
    /// @return The staked amount.
    function stakedBalance(address user) external view returns (uint256);

    /// @notice Get total staked across all users.
    /// @return The total staked amount.
    function totalStaked() external view returns (uint256);

    /// @notice Get user staking info.
    /// @param user The user address.
    /// @return staked Amount staked.
    /// @return rewards Pending rewards.
    /// @return canUnstake Whether cooldown has passed.
    function getUserInfo(address user) external view returns (
        uint256 staked,
        uint256 rewards,
        bool canUnstake
    );
}
