// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title RevyVesting
 * @notice Token vesting for team and early contributor allocations.
 * @dev Supports cliff + linear vesting schedules per beneficiary.
 *
 * Team: 12-month cliff, 24-month linear vest
 * Early Contributors: 6-month cliff, 18-month linear vest
 */
contract RevyVesting is Ownable {
    using SafeERC20 for IERC20;

    /// @notice The REVY token contract.
    IERC20 public immutable revyToken;

    struct VestingSchedule {
        uint256 totalAmount;
        uint256 claimedAmount;
        uint256 startTime;
        uint256 cliffDuration;
        uint256 vestingDuration;
        bool revocable;
        bool revoked;
    }

    /// @notice Mapping of beneficiary to their vesting schedule.
    mapping(address => VestingSchedule) public schedules;

    /// @notice List of all beneficiaries.
    address[] public beneficiaries;

    /// @notice Total tokens allocated to vesting schedules.
    uint256 public totalAllocated;

    /// @notice Total tokens claimed from vesting schedules.
    uint256 public totalClaimed;

    /// @notice Emitted when a vesting schedule is created.
    event VestingScheduleCreated(
        address indexed beneficiary,
        uint256 totalAmount,
        uint256 cliffDuration,
        uint256 vestingDuration
    );

    /// @notice Emitted when tokens are claimed from a vesting schedule.
    event TokensClaimed(address indexed beneficiary, uint256 amount);

    /// @notice Emitted when a vesting schedule is revoked.
    event VestingRevoked(address indexed beneficiary, uint256 unvestedAmount);

    error ScheduleAlreadyExists();
    error ScheduleNotFound();
    error NoTokensToClaim();
    error NotRevocable();
    error AlreadyRevoked();
    error InsufficientBalance();

    constructor(address _revyToken) Ownable(msg.sender) {
        revyToken = IERC20(_revyToken);
    }

    /// @notice Create a vesting schedule for a beneficiary.
    /// @param _beneficiary The address receiving the vested tokens.
    /// @param _totalAmount The total amount of tokens to vest.
    /// @param _cliffDuration The cliff period in seconds.
    /// @param _vestingDuration The total vesting period in seconds (after cliff).
    /// @param _revocable Whether the schedule can be revoked by the owner.
    function createSchedule(
        address _beneficiary,
        uint256 _totalAmount,
        uint256 _cliffDuration,
        uint256 _vestingDuration,
        bool _revocable
    ) external onlyOwner {
        if (schedules[_beneficiary].totalAmount > 0) {
            revert ScheduleAlreadyExists();
        }

        uint256 available = revyToken.balanceOf(address(this)) - totalAllocated + totalClaimed;
        if (available < _totalAmount) revert InsufficientBalance();

        schedules[_beneficiary] = VestingSchedule({
            totalAmount: _totalAmount,
            claimedAmount: 0,
            startTime: block.timestamp,
            cliffDuration: _cliffDuration,
            vestingDuration: _vestingDuration,
            revocable: _revocable,
            revoked: false
        });

        beneficiaries.push(_beneficiary);
        totalAllocated += _totalAmount;

        emit VestingScheduleCreated(
            _beneficiary,
            _totalAmount,
            _cliffDuration,
            _vestingDuration
        );
    }

    /// @notice Calculate the amount of tokens that have vested for a beneficiary.
    /// @param _beneficiary The beneficiary address.
    /// @return The total vested amount (including already claimed).
    function vestedAmount(address _beneficiary) public view returns (uint256) {
        VestingSchedule storage schedule = schedules[_beneficiary];

        if (schedule.totalAmount == 0) return 0;
        if (schedule.revoked) return schedule.claimedAmount;

        uint256 elapsed = block.timestamp - schedule.startTime;

        // Before cliff: nothing vested
        if (elapsed < schedule.cliffDuration) {
            return 0;
        }

        // After cliff + vesting: everything vested
        uint256 totalDuration = schedule.cliffDuration + schedule.vestingDuration;
        if (elapsed >= totalDuration) {
            return schedule.totalAmount;
        }

        // During vesting: linear
        uint256 vestingElapsed = elapsed - schedule.cliffDuration;
        return (schedule.totalAmount * vestingElapsed) / schedule.vestingDuration;
    }

    /// @notice Calculate the claimable amount for a beneficiary.
    /// @param _beneficiary The beneficiary address.
    /// @return The amount that can be claimed now.
    function claimableAmount(address _beneficiary) public view returns (uint256) {
        return vestedAmount(_beneficiary) - schedules[_beneficiary].claimedAmount;
    }

    /// @notice Claim vested tokens.
    function claim() external {
        uint256 amount = claimableAmount(msg.sender);
        if (amount == 0) revert NoTokensToClaim();

        schedules[msg.sender].claimedAmount += amount;
        totalClaimed += amount;

        revyToken.safeTransfer(msg.sender, amount);

        emit TokensClaimed(msg.sender, amount);
    }

    /// @notice Revoke a vesting schedule (owner only, if revocable).
    /// @param _beneficiary The beneficiary whose schedule to revoke.
    function revoke(address _beneficiary) external onlyOwner {
        VestingSchedule storage schedule = schedules[_beneficiary];

        if (schedule.totalAmount == 0) revert ScheduleNotFound();
        if (!schedule.revocable) revert NotRevocable();
        if (schedule.revoked) revert AlreadyRevoked();

        // Allow claiming vested portion
        uint256 vested = vestedAmount(_beneficiary);
        uint256 unvested = schedule.totalAmount - vested;

        schedule.revoked = true;
        totalAllocated -= unvested;

        // Return unvested tokens to owner
        if (unvested > 0) {
            revyToken.safeTransfer(owner(), unvested);
        }

        emit VestingRevoked(_beneficiary, unvested);
    }

    /// @notice Get the number of beneficiaries.
    /// @return The count of beneficiaries.
    function beneficiaryCount() external view returns (uint256) {
        return beneficiaries.length;
    }

    /// @notice Get detailed info about a beneficiary's vesting.
    /// @param _beneficiary The beneficiary address.
    /// @return total Total allocation.
    /// @return claimed Already claimed amount.
    /// @return claimable Currently claimable amount.
    /// @return vested Total vested amount.
    /// @return remaining Unvested remaining amount.
    function getScheduleInfo(address _beneficiary) external view returns (
        uint256 total,
        uint256 claimed,
        uint256 claimable,
        uint256 vested,
        uint256 remaining
    ) {
        VestingSchedule storage s = schedules[_beneficiary];
        total = s.totalAmount;
        claimed = s.claimedAmount;
        vested = vestedAmount(_beneficiary);
        claimable = vested - claimed;
        remaining = total - vested;
    }
}
