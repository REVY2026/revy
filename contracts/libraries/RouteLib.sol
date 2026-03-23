// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title RouteLib
 * @notice Library for route encoding, decoding, and validation.
 * @dev Used by RevyRouter for processing multi-hop route data.
 */
library RouteLib {
    /// @notice Encoded hop structure.
    struct Hop {
        address fromToken;
        address toToken;
        uint256 fromChainId;
        uint256 toChainId;
        address bridge;
        uint256 minAmountOut;
        bytes bridgeData;
    }

    /// @notice Encoded route structure.
    struct Route {
        Hop[] hops;
        address sender;
        address receiver;
        uint256 totalAmountIn;
        uint256 minTotalAmountOut;
        uint256 deadline;
        bytes32 routeId;
    }

    /// @notice Errors
    error RouteExpired();
    error InvalidHopCount();
    error InvalidChainSequence();
    error ZeroAmount();
    error InvalidReceiver();
    error InvalidBridge();
    error SlippageExceeded();

    /// @notice Validate a route before execution.
    /// @param route The route to validate.
    function validate(Route memory route) internal view {
        if (block.timestamp > route.deadline) revert RouteExpired();
        if (route.hops.length == 0 || route.hops.length > 5) revert InvalidHopCount();
        if (route.totalAmountIn == 0) revert ZeroAmount();
        if (route.receiver == address(0)) revert InvalidReceiver();

        for (uint256 i = 0; i < route.hops.length; i++) {
            if (route.hops[i].bridge == address(0)) revert InvalidBridge();
            if (route.hops[i].minAmountOut == 0) revert ZeroAmount();

            // Verify chain sequence continuity
            if (i > 0) {
                if (route.hops[i].fromChainId != route.hops[i - 1].toChainId) {
                    revert InvalidChainSequence();
                }
            }
        }
    }

    /// @notice Encode a route into bytes for storage or transmission.
    /// @param route The route to encode.
    /// @return The ABI-encoded route data.
    function encode(Route memory route) internal pure returns (bytes memory) {
        return abi.encode(
            route.hops,
            route.sender,
            route.receiver,
            route.totalAmountIn,
            route.minTotalAmountOut,
            route.deadline,
            route.routeId
        );
    }

    /// @notice Generate a unique route ID from route parameters.
    /// @param sender The sender address.
    /// @param receiver The receiver address.
    /// @param amountIn The input amount.
    /// @param nonce A unique nonce.
    /// @return The generated route ID.
    function generateRouteId(
        address sender,
        address receiver,
        uint256 amountIn,
        uint256 nonce
    ) internal view returns (bytes32) {
        return keccak256(abi.encodePacked(
            sender,
            receiver,
            amountIn,
            nonce,
            block.timestamp,
            block.chainid
        ));
    }

    /// @notice Calculate the protocol fee for a given amount.
    /// @param amount The amount to calculate the fee for.
    /// @param feeBps The fee in basis points.
    /// @return fee The calculated fee.
    /// @return amountAfterFee The amount minus the fee.
    function calculateFee(
        uint256 amount,
        uint256 feeBps
    ) internal pure returns (uint256 fee, uint256 amountAfterFee) {
        fee = (amount * feeBps) / 10000;
        amountAfterFee = amount - fee;
    }

    /// @notice Verify that output meets minimum slippage requirements.
    /// @param actualOut The actual output amount.
    /// @param minOut The minimum acceptable output.
    function verifySlippage(uint256 actualOut, uint256 minOut) internal pure {
        if (actualOut < minOut) revert SlippageExceeded();
    }

    /// @notice Check if a hop is cross-chain (different chain IDs).
    /// @param hop The hop to check.
    /// @return True if the hop crosses chains.
    function isCrossChain(Hop memory hop) internal pure returns (bool) {
        return hop.fromChainId != hop.toChainId;
    }

    /// @notice Get the total number of unique chains in a route.
    /// @param route The route to analyze.
    /// @return count The number of unique chains.
    function uniqueChainCount(Route memory route) internal pure returns (uint256 count) {
        uint256[] memory seen = new uint256[](route.hops.length * 2);
        uint256 idx = 0;

        for (uint256 i = 0; i < route.hops.length; i++) {
            bool fromSeen = false;
            bool toSeen = false;

            for (uint256 j = 0; j < idx; j++) {
                if (seen[j] == route.hops[i].fromChainId) fromSeen = true;
                if (seen[j] == route.hops[i].toChainId) toSeen = true;
            }

            if (!fromSeen) {
                seen[idx] = route.hops[i].fromChainId;
                idx++;
                count++;
            }
            if (!toSeen) {
                seen[idx] = route.hops[i].toChainId;
                idx++;
                count++;
            }
        }
    }
}
