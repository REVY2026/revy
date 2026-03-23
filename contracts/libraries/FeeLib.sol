// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title FeeLib
 * @notice Library for fee calculations, discount tiers, and volume tracking.
 * @dev Used across the Revy protocol for consistent fee logic.
 */
library FeeLib {
    /// @notice Fee tier structure for volume-based discounts.
    struct FeeTier {
        uint256 minVolume;       // Minimum cumulative volume for this tier
        uint256 discountBps;     // Discount in basis points
    }

    /// @notice Maximum fee: 50 basis points (0.5%).
    uint256 constant MAX_FEE_BPS = 50;

    /// @notice Minimum fee: 1 basis point (0.01%).
    uint256 constant MIN_FEE_BPS = 1;

    /// @notice Precision for fee calculations.
    uint256 constant BPS_DENOMINATOR = 10000;

    error FeeExceedsMaximum();
    error FeeBelowMinimum();
    error InvalidTiers();

    /// @notice Calculate the base protocol fee.
    /// @param amount The transaction amount.
    /// @param feeBps The fee rate in basis points.
    /// @return The fee amount.
    function calculateBaseFee(
        uint256 amount,
        uint256 feeBps
    ) internal pure returns (uint256) {
        if (feeBps > MAX_FEE_BPS) revert FeeExceedsMaximum();
        if (feeBps < MIN_FEE_BPS) revert FeeBelowMinimum();
        return (amount * feeBps) / BPS_DENOMINATOR;
    }

    /// @notice Calculate fee with holder discount.
    /// @param amount The transaction amount.
    /// @param baseBps The base fee in basis points.
    /// @param holderBalance The user's REVY token balance.
    /// @param discountThreshold The minimum balance for discount.
    /// @param maxDiscountBps The maximum discount in basis points.
    /// @return fee The discounted fee.
    /// @return discountApplied The discount amount.
    function calculateWithHolderDiscount(
        uint256 amount,
        uint256 baseBps,
        uint256 holderBalance,
        uint256 discountThreshold,
        uint256 maxDiscountBps
    ) internal pure returns (uint256 fee, uint256 discountApplied) {
        uint256 baseFee = calculateBaseFee(amount, baseBps);

        if (holderBalance >= discountThreshold) {
            // Linear discount based on balance (capped at maxDiscountBps)
            uint256 discountRatio = holderBalance / discountThreshold;
            if (discountRatio > 10) discountRatio = 10; // Cap at 10x threshold

            uint256 discountBps = (maxDiscountBps * discountRatio) / 10;
            discountApplied = (baseFee * discountBps) / BPS_DENOMINATOR;
            fee = baseFee - discountApplied;
        } else {
            fee = baseFee;
            discountApplied = 0;
        }

        // Enforce minimum fee
        uint256 minFee = (amount * MIN_FEE_BPS) / BPS_DENOMINATOR;
        if (fee < minFee) {
            fee = minFee;
        }
    }

    /// @notice Calculate fee with volume-based tier discount.
    /// @param amount The transaction amount.
    /// @param baseBps The base fee in basis points.
    /// @param userVolume The user's cumulative volume.
    /// @return fee The tiered fee.
    /// @return tierIndex The applied tier index.
    function calculateWithVolumeTier(
        uint256 amount,
        uint256 baseBps,
        uint256 userVolume
    ) internal pure returns (uint256 fee, uint256 tierIndex) {
        // Tier 0: < $10k volume    → no discount
        // Tier 1: $10k - $100k     → 10% discount
        // Tier 2: $100k - $1M      → 25% discount
        // Tier 3: $1M - $10M       → 40% discount
        // Tier 4: > $10M           → 50% discount (max)

        uint256 discountBps;

        if (userVolume >= 10_000_000e18) {
            tierIndex = 4;
            discountBps = 5000; // 50%
        } else if (userVolume >= 1_000_000e18) {
            tierIndex = 3;
            discountBps = 4000; // 40%
        } else if (userVolume >= 100_000e18) {
            tierIndex = 2;
            discountBps = 2500; // 25%
        } else if (userVolume >= 10_000e18) {
            tierIndex = 1;
            discountBps = 1000; // 10%
        } else {
            tierIndex = 0;
            discountBps = 0;
        }

        uint256 baseFee = calculateBaseFee(amount, baseBps);
        uint256 discount = (baseFee * discountBps) / BPS_DENOMINATOR;
        fee = baseFee - discount;

        // Enforce minimum
        uint256 minFee = (amount * MIN_FEE_BPS) / BPS_DENOMINATOR;
        if (fee < minFee) fee = minFee;
    }

    /// @notice Split a fee amount according to distribution ratios.
    /// @param totalFee The total fee to split.
    /// @param stakingBps Staking share in basis points.
    /// @param treasuryBps Treasury share in basis points.
    /// @return stakingShare Amount for stakers.
    /// @return treasuryShare Amount for treasury.
    /// @return buybackShare Amount for buyback (remainder).
    function splitFee(
        uint256 totalFee,
        uint256 stakingBps,
        uint256 treasuryBps
    ) internal pure returns (
        uint256 stakingShare,
        uint256 treasuryShare,
        uint256 buybackShare
    ) {
        stakingShare = (totalFee * stakingBps) / BPS_DENOMINATOR;
        treasuryShare = (totalFee * treasuryBps) / BPS_DENOMINATOR;
        buybackShare = totalFee - stakingShare - treasuryShare;
    }

    /// @notice Estimate the annual fee revenue from daily volume.
    /// @param dailyVolume Average daily volume.
    /// @param feeBps Fee rate in basis points.
    /// @return Annual estimated fee revenue.
    function estimateAnnualRevenue(
        uint256 dailyVolume,
        uint256 feeBps
    ) internal pure returns (uint256) {
        return (dailyVolume * feeBps * 365) / BPS_DENOMINATOR;
    }
}
