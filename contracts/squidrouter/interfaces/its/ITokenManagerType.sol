// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

/**
 * @title ITokenManagerType
 * @notice A simple interface that defines all the token manager types
 */
interface ITokenManagerType {
  enum TokenManagerType {
    MINT_BURN,
    MINT_BURN_FROM,
    LOCK_UNLOCK,
    LOCK_UNLOCK_FEE
  }
}
