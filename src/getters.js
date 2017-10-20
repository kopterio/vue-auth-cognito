export default {
  cognitoAuthenticated: state => {
    let now = Math.floor(new Date() / 1000)

    return !(state.user === null
      || (state.user && state.user.tokens === null)
      || now > state.user.expiration
    )
  }
};