import { Logger } from 'saylo';

export default {
  constructible: Logger,
  deps: {
    log: true,
    debug: false
  },
};
