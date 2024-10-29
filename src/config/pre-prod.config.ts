import { STAGE } from 'src/constants';

const config = {
  testValue: 'pre-prod value',
  apiServer: 'https://pre-prod.poktpool.com/poktpool',
  frontend: 'https://preprod--poktpool.netlify.app',
  vultrBucket: 'pokt-preprod',
  pocketCore: 'http://pocketcluster.local:8088',
};

export default () => process.env.STAGE === STAGE.PRE_PROD && config;
