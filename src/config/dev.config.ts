import { STAGE } from 'src/constants';

const config = {
  testValue: 'dev value',
  apiServer: 'https://dev.poktpool.com/poktpool',
  frontend: 'https://develop--poktpool.netlify.app',
  vultrBucket: 'pokt-dev',
  pocketCore: 'https://mainnet.gateway.pokt.network/v1/lb/53bbbc8e63afaa51691da2c6',
};

export default () => process.env.STAGE === STAGE.DEV && config;
