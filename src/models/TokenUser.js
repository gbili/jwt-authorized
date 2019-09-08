export default class TokenUser {

  constructor({ userInfo, token }) {
    Object.assign(this, userInfo);
    this.token = token;
  }

}
