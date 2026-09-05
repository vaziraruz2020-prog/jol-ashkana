import vercelApi from '../server/vercel-api.js';

export const config = {
  api: {
    bodyParser: true,
  },
};

export default vercelApi;
