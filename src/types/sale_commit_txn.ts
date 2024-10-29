export enum SALE_COMMIT_STATUS {
  PENDING = 'Pending',
  VERIFYING = 'Verifying',
  TRANSFERRING = 'Transferring',
  COMPLETE = 'Complete',
  EXPIRED = 'Expired',
  ERROR = 'Error',
  REJECTED = 'Rejected',
}

export type SALE_COMMIT_TXN = {
  sale_commit_id: number;
  customer_id: string;
  sale_commit_status: SALE_COMMIT_STATUS;
  token_amount: string;
  token_amount_processed: string;
  token_price: string;
  stake_percent: number;
  distribution_txn_hash: string;
  distribution_wallet_txn_id: string;
};
