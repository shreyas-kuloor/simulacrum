import type { RequestHandler } from 'express';
import { JWKS } from '../auth/constants';
import { removeTrailingSlash } from './url';
import { Auth0Configuration } from '../types';

type Routes =
  | '/jwks.json'
  | '/openid-configuration'

export type OpenIdRoutes = `${`/.well-known`}${Routes}`

export interface OpenIdConfiguration {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint: string;
  jwks_uri: string;
}

export const createOpenIdHandlers = (serviceURL: () => URL, options: Auth0Configuration): Record<OpenIdRoutes, RequestHandler> => {
  let { issuer } = options;
  return {
    ['/.well-known/jwks.json']: function(_, res) {
      res.json(JWKS);
    },

    ['/.well-known/openid-configuration']: function(_, res) {
      let url = removeTrailingSlash(serviceURL().toString());
      let issuerUrl = issuer ? removeTrailingSlash(issuer) : null;

      res.json({
        issuer: issuerUrl ? `${issuerUrl}/` : `${url}/`,
        authorization_endpoint: [url, "authorize"].join('/'),
        token_endpoint: [url, "oauth", "token"].join('/'),
        userinfo_endpoint: [url, "userinfo"].join('/'),
        jwks_uri: [issuerUrl ?? url, ".well-known", "jwks.json"].join('/'),
      });
    },
  };
};
