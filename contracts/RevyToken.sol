// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RevyToken
 * @notice The native governance and utility token for the Revy protocol.
 * @dev ERC-20 with burn mechanics and permit (gasless approvals).
 *
 * Token Distribution:
 *   - 40% Community & Airdrop (400,000,000)
 *   - 20% Ecosystem & Treasury (200,000,000)
 *   - 15% Team (150,000,000) — 12mo cliff, 24mo vest
 *   - 10% Liquidity (100,000,000)
 *   - 10% Early Contributors (100,000,000) — 6mo cliff, 18mo vest
 *   - 5%  Marketing (50,000,000)
 *
 * Total Supply: 1,000,000,000 REVY
 */
contract RevyToken is ERC20, ERC20Burnable, ERC20Permit, Ownable {

    /// @notice Maximum total supply: 1 billion tokens.
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 1e18;

    /// @notice Whether minting is permanently disabled.
    bool public mintingFinalized;

    /// @notice Total tokens burned to date.
    uint256 public totalBurned;

    /// @notice Addresses excluded from transfer restrictions.
    mapping(address => bool) public isExcluded;

    /// @notice Whether transfers are currently paused.
    bool public transfersPaused;

    /// @notice Emitted when minting is permanently disabled.
    event MintingFinalized();

    /// @notice Emitted when transfer pause state changes.
    event TransfersPauseToggled(bool paused);

    /// @notice Emitted when an address exclusion state changes.
    event ExclusionUpdated(address indexed account, bool excluded);

    error MintingIsFinalized();
    error ExceedsMaxSupply();
    error TransfersArePaused();
    error ZeroAddress();

    constructor(
        address _treasury,
        address _community,
        address _team,
        address _liquidity,
        address _contributors,
        address _marketing
    ) ERC20("Revy", "REVY") ERC20Permit("Revy") Ownable(msg.sender) {
        if (_treasury == address(0) || _community == address(0) ||
            _team == address(0) || _liquidity == address(0) ||
            _contributors == address(0) || _marketing == address(0)) {
            revert ZeroAddress();
        }

        // Mint initial allocations
        _mint(_community,    400_000_000 * 1e18);  // 40%
        _mint(_treasury,     200_000_000 * 1e18);  // 20%
        _mint(_team,         150_000_000 * 1e18);  // 15%
        _mint(_liquidity,    100_000_000 * 1e18);  // 10%
        _mint(_contributors, 100_000_000 * 1e18);  // 10%
        _mint(_marketing,     50_000_000 * 1e18);  // 5%

        // Exclude protocol addresses from restrictions
        isExcluded[_treasury] = true;
        isExcluded[_community] = true;
        isExcluded[msg.sender] = true;
    }

    /// @notice Mint new tokens (only before finalization).
    /// @param _to Recipient address.
    /// @param _amount Amount to mint.
    function mint(address _to, uint256 _amount) external onlyOwner {
        if (mintingFinalized) revert MintingIsFinalized();
        if (totalSupply() + _amount > MAX_SUPPLY) revert ExceedsMaxSupply();
        _mint(_to, _amount);
    }

    /// @notice Permanently disable minting. Cannot be undone.
    function finalizeMinting() external onlyOwner {
        mintingFinalized = true;
        emit MintingFinalized();
    }

    /// @notice Toggle transfer pause state.
    function toggleTransferPause() external onlyOwner {
        transfersPaused = !transfersPaused;
        emit TransfersPauseToggled(transfersPaused);
    }

    /// @notice Set exclusion state for an address.
    /// @param _account The address to update.
    /// @param _excluded Whether to exclude from restrictions.
    function setExclusion(address _account, bool _excluded) external onlyOwner {
        isExcluded[_account] = _excluded;
        emit ExclusionUpdated(_account, _excluded);
    }

    /// @notice Burn tokens and track total burned.
    /// @param amount The amount to burn.
    function burn(uint256 amount) public override {
        totalBurned += amount;
        super.burn(amount);
    }

    /// @notice Burn tokens from another address and track total burned.
    /// @param account The address to burn from.
    /// @param amount The amount to burn.
    function burnFrom(address account, uint256 amount) public override {
        totalBurned += amount;
        super.burnFrom(account, amount);
    }

    /// @notice Get the circulating supply (total - burned).
    /// @return The current circulating supply.
    function circulatingSupply() external view returns (uint256) {
        return totalSupply() - balanceOf(address(0));
    }

    /// @dev Override transfer to enforce pause and restrictions.
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override {
        // Skip checks for minting (from == 0) and burning (to == 0)
        if (from != address(0) && to != address(0)) {
            if (transfersPaused && !isExcluded[from] && !isExcluded[to]) {
                revert TransfersArePaused();
            }
        }
        super._update(from, to, value);
    }
}
