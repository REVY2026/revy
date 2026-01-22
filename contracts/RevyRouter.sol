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

    /**
     * @notice Route ERC20 tokens cross-chain
     * @param _token Token contract address
     * @param _amount Amount to route
     * @param _callData Encoded call data for the routing backend
     * @param _toChainId Destination chain ID for event logging
     */
    function routeToken(
        address _token,
        uint256 _amount,
        bytes calldata _callData,
        uint256 _toChainId
    ) external {
        require(_amount > 0, "Zero amount");

        // Transfer tokens from user to this contract
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);

        // Calculate and collect fee
        uint256 fee = (_amount * feeBasisPoints) / 10000;
        uint256 routeAmount = _amount - fee;

        // Send fee to collector
        if (fee > 0) {
            IERC20(_token).safeTransfer(feeCollector, fee);
        }

        // Approve routing backend to spend tokens
        IERC20(_token).safeIncreaseAllowance(routerBackend, routeAmount);

        // Forward to routing backend
        (bool success, ) = routerBackend.call(_callData);
        require(success, "Route execution failed");

        totalRoutes++;

        emit RouteExecuted(
            msg.sender,
            _token,
            _amount,
            _toChainId,
            fee,
            block.timestamp
        );
    }

    // ═══════════════════════════════════
    // Admin functions
    // ═══════════════════════════════════

    function setFeeBasisPoints(uint256 _newFee) external onlyOwner {
        require(_newFee <= 50, "Fee too high"); // Max 0.5%
        feeBasisPoints = _newFee;
        emit FeeUpdated(_newFee);
    }

    function setFeeCollector(address _newCollector) external onlyOwner {
        require(_newCollector != address(0), "Zero address");
        feeCollector = _newCollector;
    }

    function setRouterBackend(address _newBackend) external onlyOwner {
        require(_newBackend != address(0), "Zero address");
        routerBackend = _newBackend;
        emit RouterBackendUpdated(_newBackend);
    }

    // Emergency: recover stuck tokens
    function rescueToken(address _token, uint256 _amount) external onlyOwner {
        IERC20(_token).safeTransfer(owner(), _amount);
    }

    function rescueNative() external onlyOwner {
        (bool success, ) = owner().call{value: address(this).balance}("");
        require(success, "Rescue failed");
    }

    // Accept native token transfers
    receive() external payable {}
}
// rev: 1
