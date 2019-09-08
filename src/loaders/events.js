export default {
  factory({ logger }) {
    const events = {
      emit(...params) {
        logger.log(params);
      },
    };
    return events;
  },
  locateDeps: {
    logger: 'logger',
  },
};
