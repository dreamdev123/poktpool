import { CHAIN_TXN_TYPE_CODE } from './enums/admin.enum';

export type POOL = {
  stake_wallet_id: number;
  distribution_wallet_id: number;
  sweeps_wallet_id: number;
  fees_wallet_id: number;
  liquid_wallet_id: number;
};

export type WALLET = {
  wallet_id: number;
  network_id: number;
  wallet_address: string;
  wallet_name: string;
  rpt_display: boolean;
};

export type POOL_WALLETS = {
  stake_wallet: WALLET;
  distribution_wallet: WALLET;
  sweeps_wallet: WALLET;
  fees_wallet: WALLET;
  liquid_wallet: WALLET;
};

export type TRANCHE_STATS = {
  tranche_id: number;
  tranche_end: string;
  pool_tranche_seq: number;
  infrastructure_fees: number;
  commissions: number;
  balance_unstaked: number;
  rewards_unstaked: number;
  unstakes_tosend: number;
  sweeps_tosend: number;
  rollovers: number;
  new_equity_injected: number;
  cancelled_unstakes: number;
  total_incoming_equity: number;
  incoming_unstakes: number;
  active_nodes: number;
  exchange_rate: number;
};

export type VENDOR_POOL_ADMIN = {
  vendor_id: number;
  pool_id: number;
  rev_share_rate: number;
  rev_share_over: string;
  reward_sweep_wallet_id: number;
  is_custodial: boolean;
  deduct_revshare: boolean;
  is_active: boolean;
  revshare_wallet_id: number;
};

export type VENDOR = {
  vendor_id: number;
  vendor_name: string;
  vendor_pool_admin: VENDOR_POOL_ADMIN;
  revshare_wallet?: WALLET;
  reward_sweep_wallet: WALLET;
  balance?: {
    value: string;
    inbound_time: string;
  };
  earned_per_15k?: string;
};

export type TRANCHE_TXN = {
  vendor_id?: number;
  pool_id: number;
  tranche_id: number;
  from_wallet_id: number;
  to_wallet_id: number;
  recipient_wallet_address?: string;
  txn_timestamp: string;
  block_id: number;
  chain_txn_type_code: CHAIN_TXN_TYPE_CODE;
  memo: string;
  amount: string;
  txn_success: boolean;
  network_txn_hash: string;
};

export type SWEEP_REQ_HIST = {
  sweep_req_id: number;
  customer_id: string;
  currency_code: number;
  amt_swept: string;
  perc_swept: string;
  sweep_req_date: string;
  sweep_process_date: any;
  sweep_complete: boolean;
  txn_type_code: number;
  to_wallet: string;
};

export type UNSTAKE_DUE = {
  unstake_req_id: number;
  recpt_wallet: string;
  amount: number;
};
