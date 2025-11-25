// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint8, externalEuint8} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title CreditPulse - Enterprise Credit Privacy Rating Tool
/// @notice FHE-powered on-chain credit profiling system
/// @dev Uses FHEVM for encrypted credit assessment calculations
contract CreditPulse is ZamaEthereumConfig {
    
    // Encrypted assessment data per user
    struct EncryptedAssessment {
        euint8 scaleScore;    // Enterprise scale score (3-14)
        euint8 healthScore;   // Financial health score (3-11)
        uint256 timestamp;    // Assessment timestamp
        bool exists;          // Whether assessment exists
    }
    
    // Mapping from user address to their encrypted assessment
    mapping(address => EncryptedAssessment) private assessments;
    
    // Events
    event AssessmentSubmitted(address indexed user, uint256 timestamp);
    event AssessmentCompleted(address indexed user);
    
    /// @notice Submit an encrypted credit assessment
    /// @param encRevenue Encrypted annual revenue code (1-5)
    /// @param encEmployees Encrypted employee count code (1-5)
    /// @param encYears Encrypted years in business code (1-4)
    /// @param encDebtRatio Encrypted debt ratio code (1-5)
    /// @param encCashflow Encrypted cashflow status code (1-3)
    /// @param encLitigation Encrypted litigation status code (1-3)
    /// @param inputProof The proof for all encrypted inputs
    function submitAssessment(
        externalEuint8 encRevenue,
        externalEuint8 encEmployees,
        externalEuint8 encYears,
        externalEuint8 encDebtRatio,
        externalEuint8 encCashflow,
        externalEuint8 encLitigation,
        bytes calldata inputProof
    ) external {
        // Convert external inputs to internal encrypted values
        euint8 revenue = FHE.fromExternal(encRevenue, inputProof);
        euint8 employees = FHE.fromExternal(encEmployees, inputProof);
        euint8 businessYears = FHE.fromExternal(encYears, inputProof);
        euint8 debtRatio = FHE.fromExternal(encDebtRatio, inputProof);
        euint8 cashflow = FHE.fromExternal(encCashflow, inputProof);
        euint8 litigation = FHE.fromExternal(encLitigation, inputProof);
        
        // Calculate scale score: revenue + employees + years (range: 3-14)
        euint8 scaleScore = FHE.add(FHE.add(revenue, employees), businessYears);
        
        // Calculate health score: debtRatio + cashflow + litigation (range: 3-11)
        euint8 healthScore = FHE.add(FHE.add(debtRatio, cashflow), litigation);
        
        // Store encrypted results
        assessments[msg.sender] = EncryptedAssessment({
            scaleScore: scaleScore,
            healthScore: healthScore,
            timestamp: block.timestamp,
            exists: true
        });
        
        // Allow contract and user to access the encrypted values
        FHE.allowThis(scaleScore);
        FHE.allow(scaleScore, msg.sender);
        FHE.allowThis(healthScore);
        FHE.allow(healthScore, msg.sender);
        
        emit AssessmentSubmitted(msg.sender, block.timestamp);
        emit AssessmentCompleted(msg.sender);
    }
    
    /// @notice Get the encrypted scale grade for a user
    /// @param user The address of the user
    /// @return The encrypted scale score
    function getScaleGrade(address user) external view returns (euint8) {
        require(assessments[user].exists, "No assessment found");
        return assessments[user].scaleScore;
    }
    
    /// @notice Get the encrypted health grade for a user
    /// @param user The address of the user
    /// @return The encrypted health score
    function getHealthGrade(address user) external view returns (euint8) {
        require(assessments[user].exists, "No assessment found");
        return assessments[user].healthScore;
    }
    
    /// @notice Check if a user has an assessment
    /// @param user The address to check
    /// @return Whether the user has submitted an assessment
    function hasAssessment(address user) external view returns (bool) {
        return assessments[user].exists;
    }
    
    /// @notice Get the timestamp of user's assessment
    /// @param user The address of the user
    /// @return The timestamp of the assessment
    function getAssessmentTimestamp(address user) external view returns (uint256) {
        require(assessments[user].exists, "No assessment found");
        return assessments[user].timestamp;
    }
}

