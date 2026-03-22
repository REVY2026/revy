// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title RevyGovernance
 * @notice On-chain governance for the Revy protocol.
 * @dev Token holders can create and vote on proposals.
 *      Proposals can modify protocol parameters (fee rates, supported chains,
 *      treasury allocation) through a timelock mechanism.
 */
contract RevyGovernance is Ownable {

    /// @notice The REVY token used for voting power.
    IERC20 public immutable revyToken;

    /// @notice Minimum tokens required to create a proposal.
    uint256 public proposalThreshold = 1_000_000 * 1e18;

    /// @notice Voting period in blocks (~3 days at 12s/block).
    uint256 public votingPeriod = 21600;

    /// @notice Timelock delay before execution (48 hours).
    uint256 public timelockDelay = 48 hours;

    /// @notice Quorum required for a proposal to pass (% of total supply in bps).
    uint256 public quorumBps = 400; // 4%

    /// @notice Total proposals created.
    uint256 public proposalCount;

    enum ProposalState {
        Pending,
        Active,
        Defeated,
        Succeeded,
        Queued,
        Executed,
        Cancelled
    }

    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        address[] targets;
        uint256[] values;
        bytes[] calldatas;
        uint256 startBlock;
        uint256 endBlock;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        uint256 executionTime;
        bool executed;
        bool cancelled;
    }

    /// @notice Mapping of proposal ID to proposal.
    mapping(uint256 => Proposal) public proposals;

    /// @notice Mapping of proposal ID to voter to whether they have voted.
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    /// @notice Mapping of proposal ID to voter to their vote receipt.
    mapping(uint256 => mapping(address => uint8)) public voteReceipt;

    /// @notice Emitted when a proposal is created.
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string description
    );

    /// @notice Emitted when a vote is cast.
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        uint8 support,
        uint256 weight
    );

    /// @notice Emitted when a proposal is executed.
    event ProposalExecuted(uint256 indexed proposalId);

    /// @notice Emitted when a proposal is cancelled.
    event ProposalCancelled(uint256 indexed proposalId);

    /// @notice Emitted when a proposal is queued for execution.
    event ProposalQueued(uint256 indexed proposalId, uint256 executionTime);

    error InsufficientVotingPower();
    error ProposalNotActive();
    error AlreadyVoted();
    error ProposalNotSucceeded();
    error TimelockNotMet();
    error ProposalAlreadyExecuted();
    error ExecutionFailed();
    error InvalidProposal();
    error NotProposer();

    constructor(address _revyToken) Ownable(msg.sender) {
        revyToken = IERC20(_revyToken);
    }

    /// @notice Create a new governance proposal.
    /// @param _description Human-readable description.
    /// @param _targets Contract addresses to call.
    /// @param _values ETH values for each call.
    /// @param _calldatas Encoded function calls.
    /// @return proposalId The ID of the new proposal.
    function propose(
        string calldata _description,
        address[] calldata _targets,
        uint256[] calldata _values,
        bytes[] calldata _calldatas
    ) external returns (uint256 proposalId) {
        if (revyToken.balanceOf(msg.sender) < proposalThreshold) {
            revert InsufficientVotingPower();
        }
        if (_targets.length == 0 || _targets.length != _values.length ||
            _targets.length != _calldatas.length) {
            revert InvalidProposal();
        }

        proposalCount++;
        proposalId = proposalCount;

        Proposal storage p = proposals[proposalId];
        p.id = proposalId;
        p.proposer = msg.sender;
        p.description = _description;
        p.targets = _targets;
        p.values = _values;
        p.calldatas = _calldatas;
        p.startBlock = block.number + 1;
        p.endBlock = block.number + 1 + votingPeriod;

        emit ProposalCreated(proposalId, msg.sender, _description);
    }

    /// @notice Cast a vote on a proposal.
    /// @param _proposalId The proposal to vote on.
    /// @param _support 0 = against, 1 = for, 2 = abstain.
    function castVote(uint256 _proposalId, uint8 _support) external {
        Proposal storage p = proposals[_proposalId];

        if (block.number < p.startBlock || block.number > p.endBlock) {
            revert ProposalNotActive();
        }
        if (hasVoted[_proposalId][msg.sender]) {
            revert AlreadyVoted();
        }

        uint256 weight = revyToken.balanceOf(msg.sender);
        if (weight == 0) revert InsufficientVotingPower();

        hasVoted[_proposalId][msg.sender] = true;
        voteReceipt[_proposalId][msg.sender] = _support;

        if (_support == 0) {
            p.againstVotes += weight;
        } else if (_support == 1) {
            p.forVotes += weight;
        } else {
            p.abstainVotes += weight;
        }

        emit VoteCast(_proposalId, msg.sender, _support, weight);
    }

    /// @notice Queue a succeeded proposal for execution.
    /// @param _proposalId The proposal to queue.
    function queue(uint256 _proposalId) external {
        if (state(_proposalId) != ProposalState.Succeeded) {
            revert ProposalNotSucceeded();
        }

        Proposal storage p = proposals[_proposalId];
        p.executionTime = block.timestamp + timelockDelay;

        emit ProposalQueued(_proposalId, p.executionTime);
    }

    /// @notice Execute a queued proposal after timelock.
    /// @param _proposalId The proposal to execute.
    function execute(uint256 _proposalId) external {
        Proposal storage p = proposals[_proposalId];

        if (p.executed) revert ProposalAlreadyExecuted();
        if (state(_proposalId) != ProposalState.Queued) {
            revert ProposalNotSucceeded();
        }
        if (block.timestamp < p.executionTime) {
            revert TimelockNotMet();
        }

        p.executed = true;

        for (uint256 i = 0; i < p.targets.length; i++) {
            (bool success, ) = p.targets[i].call{value: p.values[i]}(p.calldatas[i]);
            if (!success) revert ExecutionFailed();
        }

        emit ProposalExecuted(_proposalId);
    }

    /// @notice Cancel a proposal (only by proposer or owner).
    /// @param _proposalId The proposal to cancel.
    function cancel(uint256 _proposalId) external {
        Proposal storage p = proposals[_proposalId];
        if (msg.sender != p.proposer && msg.sender != owner()) {
            revert NotProposer();
        }
        if (p.executed) revert ProposalAlreadyExecuted();

        p.cancelled = true;
        emit ProposalCancelled(_proposalId);
    }

    /// @notice Get the current state of a proposal.
    /// @param _proposalId The proposal to check.
    /// @return The current proposal state.
    function state(uint256 _proposalId) public view returns (ProposalState) {
        Proposal storage p = proposals[_proposalId];

        if (p.cancelled) return ProposalState.Cancelled;
        if (p.executed) return ProposalState.Executed;
        if (block.number <= p.startBlock) return ProposalState.Pending;
        if (block.number <= p.endBlock) return ProposalState.Active;

        uint256 quorum = (revyToken.totalSupply() * quorumBps) / 10000;
        bool quorumReached = (p.forVotes + p.abstainVotes) >= quorum;
        bool majorityFor = p.forVotes > p.againstVotes;

        if (!quorumReached || !majorityFor) return ProposalState.Defeated;
        if (p.executionTime == 0) return ProposalState.Succeeded;
        return ProposalState.Queued;
    }

    /// @notice Update the proposal threshold.
    /// @param _threshold New minimum tokens required.
    function setProposalThreshold(uint256 _threshold) external onlyOwner {
        proposalThreshold = _threshold;
    }

    /// @notice Update the voting period.
    /// @param _period New voting period in blocks.
    function setVotingPeriod(uint256 _period) external onlyOwner {
        votingPeriod = _period;
    }

    /// @notice Update the quorum requirement.
    /// @param _quorumBps New quorum in basis points of total supply.
    function setQuorumBps(uint256 _quorumBps) external onlyOwner {
        quorumBps = _quorumBps;
    }

    /// @notice Update the timelock delay.
    /// @param _delay New delay in seconds.
    function setTimelockDelay(uint256 _delay) external onlyOwner {
        timelockDelay = _delay;
    }
}
