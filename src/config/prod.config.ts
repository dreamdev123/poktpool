import { STAGE } from 'src/constants';

const config = {
  testValue: 'prod value',
  apiServer: 'https://api.poktpool.com/poktpool',
  frontend: 'https://poktpool.com',
  vultrBucket: 'pokt',
  pocketCore: 'http://pocketcluster.local:8088',
};

export default () => process.env.STAGE === STAGE.PROD && config;
