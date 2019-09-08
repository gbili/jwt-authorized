export default {
  instance: function({ secondsTTL }) {
    const time = (new Date()).getTime() + 1000 * secondsTTL;
    return time;
  },
};
