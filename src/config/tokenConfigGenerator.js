import jws from 'jws';

const nHoursFromNow = n => {
  return _ => (Math.floor(Date.now() / 1000) + n * (60 * 60));
};

export default function({ expireTokensEveryNHours }) {
  return {
    engine: jws,
    expiresIn: nHoursFromNow(expireTokensEveryNHours),
    now: nHoursFromNow(0),
    algorithm: 'HS256',
    keys: {
      privateKey: process.env.JWT_KEY_PRIVATE,
    },
  };
};
