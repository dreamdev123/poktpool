export type WALLET_VERF_REQ = {
  verf_req_id: number;
  user_id: string;
  wallet_address: string;
  wallet_nickname: string;
  network_id: number;
  pool_id: number;
  req_status: string;
  verf_amount: number;
  verf_txn_hash: string;
  req_timestamp: string;
  exp_timestamp: string;
};
