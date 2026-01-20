// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title RevyRouter
 * @notice Cross-chain routing powered by Levy Flight algorithm.
 *         Routes user transactions through optimal paths discovered by the Revy engine.
 */
contract RevyRouter is Ownable {
    using SafeERC20 for IERC20;

    // Li.Fi Diamond contract (internal — not exposed to users)
    address public routerBackend;

    // Protocol fee: 0.02% (2 basis points)
    uint256 public feeBasisPoints = 2;
    address public feeCollector;

    // Stats
    uint256 public totalRoutes;
    uint256 public totalVolumeUsd;

    // Events
    event RouteExecuted(
        address indexed user,
        address indexed fromToken,
        uint256 fromAmount,
        uint256 toChainId,
        uint256 fee,
        uint256 timestamp
    );

    event FeeUpdated(uint256 newFeeBasisPoints);
    event RouterBackendUpdated(address newBackend);

    constructor(address _routerBackend, address _feeCollector) Ownable(msg.sender) {
        routerBackend = _routerBackend;
        feeCollector = _feeCollector;
    }

    /**
     * @notice Route native tokens (ETH/MATIC/BNB etc.) cross-chain
     * @param _callData Encoded call data for the routing backend
     * @param _toChainId Destination chain ID for event logging
     */
    function routeNative(
        bytes calldata _callData,
        uint256 _toChainId
    ) external payable {
        require(msg.value > 0, "No value sent");

        // Calculate and collect fee
        uint256 fee = (msg.value * feeBasisPoints) / 10000;
        uint256 routeAmount = msg.value - fee;

        // Send fee to collector
        if (fee > 0) {
            (bool feeSuccess, ) = feeCollector.call{value: fee}("");
            require(feeSuccess, "Fee transfer failed");
        }

        // Forward to routing backend (Li.Fi internally)
        (bool success, ) = routerBackend.call{value: routeAmount}(_callData);
        require(success, "Route execution failed");

        totalRoutes++;

        emit RouteExecuted(
            msg.sender,
            address(0), // native token
            msg.value,
            _toChainId,
            fee,
            block.timestamp
        );
    }