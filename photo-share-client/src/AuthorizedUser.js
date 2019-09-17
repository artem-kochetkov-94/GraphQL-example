import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import { Query, Mutation, withApollo } from "react-apollo";
import * as compose from "lodash.flowright";
import { ROOT_QUERY } from "./App";
import { gql } from "apollo-boost";

const GITHUB_AUTH_MUTATION = gql`
  mutation githubAuth($code: String!) {
    githubAuth(code: $code) {
      token
    }
  }
`;

const CurrentUser = ({ name, avatar, logout }) => (
  <div>
    <img src={avatar} width={48} height={48} alt="" />
    <h1>{name}</h1>
    <button onClick={logout}>logout</button>
  </div>
);

const Me = ({ logout, requestCode, signingIn }) => (
  <Query query={ROOT_QUERY} fetchPolicy="cache-only">
    {({ loading, data }) =>
      data && data.me ? (
        <CurrentUser {...data.me} logout={logout} />
      ) : loading ? (
        <p>loading... </p>
      ) : (
        <button onClick={requestCode} disabled={signingIn}>
          Sign In with Github
        </button>
      )
    }
  </Query>
);

class AuthorizedUser extends Component {
  state = { signingIn: false };

  authorizationComplete = (cache, { data }) => {
    localStorage.setItem("token", data.githubAuth.token);
    this.props.history.replace("/");
    this.setState({ signingIn: false });
  };

  componentDidMount() {
    if (window.location.search.match(/code=/)) {
      this.setState({ signingIn: true });
      const code = window.location.search.replace("?code=", "");
      this.githubAuthMutation({ variables: { code } });
    }
  }

  requestCode() {
    var clientID = "0e5cd23d5da2f89e5784";
    window.location = `https://github.com/login/oauth/authorize?client_id=${clientID}&scope=user`;
  }

  logout = () => {
    localStorage.removeItem("token");
    let data = this.props.client.readQuery({ query: ROOT_QUERY });
    data.me = null;
    this.props.client.writeQuery({ query: ROOT_QUERY, data });
  };

  render() {
    return (
      <Mutation
        mutation={GITHUB_AUTH_MUTATION}
        update={this.authorizationComplete}
        refetchQueries={[{ query: ROOT_QUERY }]}
      >
        {mutation => {
          this.githubAuthMutation = mutation;
          return (
            <div>
              <Me
                signingIn={this.state.signingIn}
                requestCode={this.requestCode}
                logout={this.logout}
              />
            </div>
          );
        }}
      </Mutation>
    );
  }
}

export default compose(
  withApollo,
  withRouter
)(AuthorizedUser);
