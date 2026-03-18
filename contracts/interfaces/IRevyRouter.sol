// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IRevyRouter
 * @notice Interface for the Revy cross-chain routing protocol.
 * @dev All external integrations should use this interface.
 */
interface IRevyRouter {
    /// @notice Emitted when a route is executed through the protocol.
    /// @param sender The address initiating the route.
    /// @param token The token address being routed (address(0) for native).
    /// @param amount The amount of tokens routed.
    /// @param fee The protocol fee collected.
    /// @param routeId A unique identifier for the route execution.
    event RouteExecuted(
        address indexed sender,
        address indexed token,
        uint256 amount,
        uint256 fee,
        bytes32 routeId
    );

    /// @notice Emitted when the protocol fee is updated.
    /// @param oldFee The previous fee in basis points.
    /// @param newFee The new fee in basis points.
    event FeeUpdated(uint256 oldFee, uint256 newFee);

    /// @notice Emitted when the router backend is updated.
    /// @param oldBackend The previous backend address.
    /// @param newBackend The new backend address.
    event RouterBackendUpdated(address oldBackend, address newBackend);

    /// @notice Route native tokens (ETH/MATIC/etc.) through the protocol.
    /// @param _callData The encoded call data for the backend router.
    /// @return success Whether the route was executed successfully.
    function routeNative(bytes calldata _callData) external payable returns (bool success);

    /// @notice Route ERC-20 tokens through the protocol.
    /// @param _token The ERC-20 token contract address.
    /// @param _amount The amount of tokens to route.
    /// @param _callData The encoded call data for the backend router.
    /// @return success Whether the route was executed successfully.
    function routeToken(
        address _token,
        uint256 _amount,
        bytes calldata _callData
    ) external returns (bool success);

    /// @notice Get the current protocol fee in basis points.
    /// @return feeBps The fee in basis points (1 bp = 0.01%).
    function feeBasisPoints() external view returns (uint256 feeBps);

    /// @notice Get the current router backend address.
    /// @return backend The address of the backend router contract.
    function routerBackend() external view returns (address backend);

    /// @notice Get the total volume routed through the protocol.
    /// @return volume The cumulative volume in wei.
    function totalVolumeRouted() external view returns (uint256 volume);

    /// @notice Get the total fees collected by the protocol.
    /// @return fees The cumulative fees in wei.
    function totalFeesCollected() external view returns (uint256 fees);

    /// @notice Get the number of routes executed through the protocol.
    /// @return count The total number of route executions.
    function routeCount() external view returns (uint256 count);
}
