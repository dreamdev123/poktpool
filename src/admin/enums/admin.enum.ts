export enum FEATURE {
  TRANCHE_CLOSE = 1,
  ADD_NODES = 2,
  MEMBER_LOOKUP = 3,
  INDIVIDUAL_UNSTAKES = 4,
  UPCOMING_STAKES = 5,
  SUPER_ADMIN_REPORT = 9,
  NODE_DASHBOARD = 6,
  WALLET_BALANCES = 7,
  REPORT_CLOSED_TRANCHES = 8,
  STAKE_POSITION_REPORT = 11,
  SELL_POKT = 1,
  ADMIN_SEGMENT = 13,
  ADMIN_BONUS = 14,
  ADMIN_PRICING_MODEL = 15,
  ADMIN_ROLE_EDIT = 16,
}

export enum CHAIN_TXN_TYPE_CODE {
  INJECTIONS_TO_LIQUID = 1,
  ROLLOVERS_TO_LIQUID = 2,
  INFRA_FEES_TO_PPINC = 3,
  REV_SHARE_TO_PPINC = 4,
  SWEEPS_TO_SWEEP = 5,
  BALANCE_UNSTAKES_TO_SWEEP = 6,
  REWARD_UNSTAKES_TO_SWEEP = 7,
  PROVIDER_SWEEP_AGGREGATION = 8,
  REV_SHARE_TO_PROVIDER = 9,
  SWEEP_TO_MEMBER = 10,
  UNSTAKE_TO_MEMBER = 11,
}

export const DISTRIBUTE_CHAIN_TXN_TYPE_CODES = [
  CHAIN_TXN_TYPE_CODE.INJECTIONS_TO_LIQUID,
  CHAIN_TXN_TYPE_CODE.ROLLOVERS_TO_LIQUID,
  CHAIN_TXN_TYPE_CODE.INFRA_FEES_TO_PPINC,
  CHAIN_TXN_TYPE_CODE.REV_SHARE_TO_PPINC,
  CHAIN_TXN_TYPE_CODE.SWEEPS_TO_SWEEP,
  CHAIN_TXN_TYPE_CODE.BALANCE_UNSTAKES_TO_SWEEP,
  CHAIN_TXN_TYPE_CODE.REWARD_UNSTAKES_TO_SWEEP,
  CHAIN_TXN_TYPE_CODE.SWEEP_TO_MEMBER,
  CHAIN_TXN_TYPE_CODE.UNSTAKE_TO_MEMBER,
];

export enum RPT_PARAM_KEY {
  ADMIN_WALLETS_ORDER = 'admin_wallets_order',
}