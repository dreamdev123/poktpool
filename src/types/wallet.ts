export enum WALLET_TYPE_CODE {
  USDC_RECEIVE = 1,
  POKT_SALES = 2,
}

export type WALLET = {
  wallet_id: number;
  network_id: number;
  wallet_address: string;
  wallet_name: string;
  rpt_display: boolean;
  wallet_type_code: WALLET_TYPE_CODE;
};
