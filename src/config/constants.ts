/**
 * Application-wide constants
 */

/**
 * Health Factor Thresholds
 * Based on Aave protocol recommendations:
 * - Below 1.0: Position can be liquidated
 * - Below 1.5: Position at risk, user should add collateral or repay debt
 * - Above 1.5: Position is relatively safe
 */
export const HEALTH_FACTOR_THRESHOLDS = {
  /** Position can be liquidated */
  LIQUIDATION: 1.0,
  /** Warning threshold - position at risk */
  WARNING: 1.5,
} as const

/**
 * UI Timing Constants (in milliseconds)
 */
export const UI_DELAYS = {
  /** Delay before scrolling to allow React state updates */
  SCROLL_DELAY_MS: 100,
  /** Delay after approval before triggering next transaction (allows for allowance refetch) */
  POST_APPROVAL_DELAY_MS: 500,
} as const

/**
 * Transaction Amount Thresholds
 * Used for confirmation dialogs on large transactions
 */
export const TRANSACTION_THRESHOLDS = {
  /** Amount in tokens/USD that triggers a confirmation dialog */
  LARGE_AMOUNT: 1000,
  /** Percentage of balance (0-1) that triggers confirmation for deposits */
  DEPOSIT_BALANCE_RATIO: 0.8,
  /** Percentage of available borrows (0-1) that triggers confirmation */
  BORROW_AVAILABLE_RATIO: 0.5,
} as const
