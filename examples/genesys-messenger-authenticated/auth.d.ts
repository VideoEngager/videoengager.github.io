// import BaseClient, { Storage, StorageKey, ConversalyseAuthConfig } from '@convnersalyse-auth/client';
// export { AccessTokenClaims, default as BaseClient, ClientAdapter, ConversalyseAuthClientError, ConversalyseAuthClientErrorCode, ConversalyseAuthConfig, ConversalyseAuthError, ConversalyseAuthErrorCode, ConversalyseAuthRequestError, IdTokenClaims, InteractionMode, OidcError, PersistKey, Prompt, ReservedResource, ReservedScope, SignInOptions, Storage, UserInfoResponse, UserScope, buildOrganizationUrn, createRequester, getOrganizationIdFromUrn, isConversalyseAuthRequestError, organizationUrnPrefix } from '@convnersalyse-auth/client';


// import { Nullable } from '@silverhand/essentials';
declare module '@convnersalyse-auth/essentials' {
    export type Nullable<T> = T | null;
    /**
     * Compose a new type from another type by mapping snake case type keys to camel case
     * E.g. type T = { key_of_string: string } => type U = { keyOfString: string }
     *
     * Inspired by:
     * https://stackoverflow.com/a/65015868/3431443
     */
    export type CamelCase<S extends string> = S extends `${infer P1}_${infer P2}${infer P3}` ? `${Lowercase<P1>}${Uppercase<P2>}${CamelCase<P3>}` : Lowercase<S>;
    export type SnakeCase<S extends string> = S extends `${infer P1}${infer P2}${infer P3}` ? `${P1}${P2 extends Uppercase<P2> ? '_' : ''}${Lowercase<P2>}${SnakeCase<P3>}` : Lowercase<S>;
    export type KeysToCamelCase<T> = {
        [K in keyof T as CamelCase<string & K>]: T[K] extends Record<string, unknown> ? KeysToCamelCase<T[K]> : T[K];
    };
}
declare module '@convnersalyse-auth/js' {
    import { KeysToCamelCase, Nullable } from '@convnersalyse-auth/essentials';

    type ConversalyseAuthRequestErrorBody = {
        code: string;
        message: string;
    };
    /**
     * A request function that accepts a `fetch`-like function parameters and returns
     * a promise with the parsed response body.
     */
    type Requester = <T>(...args: Parameters<typeof fetch>) => Promise<T>;
    /**
     * The interaction mode to be used for the authorization request. Note it's not
     * a part of the OIDC standard, but a ConversalyseAuth-specific extension.
     *
     * - `signIn`: The authorization request will be initiated with a sign-in page.
     * - `signUp`: The authorization request will be initiated with a sign-up page.
     *
     * @deprecated Use `FirstScreen` instead.
     */
    type InteractionMode = 'signIn' | 'signUp';
    /**
     * The first screen to be shown in the sign-in experience. Note it's not a part of the OIDC
     * standard, but a ConversalyseAuth-specific extension.
     *
     * Note: `signIn` is deprecated, use `sign_in` instead
     */
    type FirstScreen = 'signIn' | 'sign_in' | 'register' | 'reset_password' | 'identifier:sign_in' | 'identifier:register' | 'single_sign_on';

    type FetchTokenByAuthorizationCodeParameters = {
        clientId: string;
        tokenEndpoint: string;
        redirectUri: string;
        codeVerifier: string;
        code: string;
        resource?: string;
    };
    type FetchTokenByRefreshTokenParameters = {
        /** The client ID of the application. */
        clientId: string;
        /** The token endpoint of the authorization server. */
        tokenEndpoint: string;
        /** The refresh token to be used to fetch the organization access token. */
        refreshToken: string;
        /** The API resource to be fetch the access token for. */
        resource?: string;
        /** The ID of the organization to be fetch the access token for. */
        organizationId?: string;
        /**
         * The scopes to request for the access token. If not provided, the authorization server
         * will use all the scopes that the client is authorized for.
         */
        scopes?: string[];
    };
    type SnakeCaseCodeTokenResponse = {
        access_token: string;
        refresh_token?: string;
        id_token: string;
        scope: string;
        expires_in: number;
    };
    type CodeTokenResponse = KeysToCamelCase<SnakeCaseCodeTokenResponse>;
    type SnakeCaseRefreshTokenTokenResponse = {
        access_token: string;
        refresh_token?: string;
        id_token?: string;
        scope: string;
        expires_in: number;
    };
    type RefreshTokenTokenResponse = KeysToCamelCase<SnakeCaseRefreshTokenTokenResponse>;
    export const fetchTokenByAuthorizationCode: ({ clientId, tokenEndpoint, redirectUri, codeVerifier, code, resource, }: FetchTokenByAuthorizationCodeParameters, requester: Requester) => Promise<CodeTokenResponse>;
    /**
     * Fetch access token by refresh token using the token endpoint and `refresh_token` grant type.
     * @param params The parameters for fetching access token.
     * @param requester The requester for sending HTTP request.
     * @returns A Promise that resolves to the access token response.
     */
    export const fetchTokenByRefreshToken: (params: FetchTokenByRefreshTokenParameters, requester: Requester) => Promise<RefreshTokenTokenResponse>;

    type OidcConfigSnakeCaseResponse = {
        authorization_endpoint: string;
        token_endpoint: string;
        userinfo_endpoint: string;
        end_session_endpoint: string;
        revocation_endpoint: string;
        jwks_uri: string;
        issuer: string;
    };
    export const discoveryPath = "/.well-known/openid-configuration";
    type OidcConfigResponse = KeysToCamelCase<OidcConfigSnakeCaseResponse>;
    export const fetchOidcConfig: (endpoint: string, requester: Requester) => Promise<OidcConfigResponse>;

    export const revoke: (revocationEndpoint: string, clientId: string, token: string, requester: Requester) => Promise<void>;

    /**
     * @overview Constants for ConversalyseAuth. Synchronized with `@convnersalyse-auth/core-kit` package at hash `081094d`.
     */
    /** Scopes that reserved by ConversalyseAuth, which will be added to the auth request automatically. */
    export enum ReservedScope {
        OpenId = "openid"
    }
    /** Resources that reserved by ConversalyseAuth, which cannot be defined by users. */
    export enum ReservedResource {
        /**
         * The resource for organization template per RFC 0001.
         *
         */
        Organization = "urn:conversalyse:resource:organizations"
    }
    type UserClaim = 'name' | 'picture' | 'username' | 'email' | 'email_verified' | 'phone_number' | 'phone_number_verified' | 'roles' | 'organizations' | 'organization_roles' | 'custom_data' | 'identities';
    /**
     * Scopes for ID Token and Userinfo Endpoint.
     */
    export enum UserScope {
        /**
         * Scope for basic user info.
         *
         * See {@link idTokenClaims} for mapped claims in ID Token and {@link userinfoClaims} for additional claims in Userinfo Endpoint.
         */
        Profile = "profile",
        /**
         * Scope for user email address.
         *
         * See {@link idTokenClaims} for mapped claims in ID Token and {@link userinfoClaims} for additional claims in Userinfo Endpoint.
         */
        Email = "email",
        /**
         * Scope for user phone number.
         *
         * See {@link idTokenClaims} for mapped claims in ID Token and {@link userinfoClaims} for additional claims in Userinfo Endpoint.
         */
        Phone = "phone",
        /**
         * Scope for user address.
         *
         * See {@link idTokenClaims} for mapped claims in ID Token and {@link userinfoClaims} for additional claims in Userinfo Endpoint.
         */
        Address = "address",
        /**
         * Scope for user's custom data.
         *
         * See {@link idTokenClaims} for mapped claims in ID Token and {@link userinfoClaims} for additional claims in Userinfo Endpoint.
         */
        CustomData = "custom_data",
        /**
         * Scope for user's social identity details.
         *
         * See {@link idTokenClaims} for mapped claims in ID Token and {@link userinfoClaims} for additional claims in Userinfo Endpoint.
         */
        Identities = "identities",
        /**
         * Scope for user's roles.
         *
         * See {@link idTokenClaims} for mapped claims in ID Token and {@link userinfoClaims} for additional claims in Userinfo Endpoint.
         */
        Roles = "roles",
        /**
         * Scope for user's organization IDs and perform organization token grant per [RFC 0001].
         *
         */
        Organizations = "urn:conversalyse:scope:organizations",
        /**
         * Scope for user's organization roles per [RFC 0001].
         *
         * See {@link idTokenClaims} for mapped claims in ID Token and {@link userinfoClaims} for additional claims in Userinfo Endpoint.
         */
        OrganizationRoles = "urn:conversalyse:scope:organization_roles"
    }
    /**
     * Mapped claims that ID Token includes.
     */
    export const idTokenClaims: Readonly<Record<UserScope, UserClaim[]>>;
    /**
     * Additional claims that Userinfo Endpoint returns.
     */
    export const userinfoClaims: Readonly<Record<UserScope, UserClaim[]>>;
    export const userClaims: Readonly<Record<UserScope, UserClaim[]>>;
    /**
     * The prefix of the URN (Uniform Resource Name) for the organization in ConversalyseAuth.
     *
     * @example
     * ```
     * urn:conversalyse:organization:123 // organization with ID 123
     * ```
     * @see {@link https://en.wikipedia.org/wiki/Uniform_Resource_Name | Uniform Resource Name}
     */
    export const organizationUrnPrefix = "urn:conversalyse:organization:";
    /**
     * Build the URN (Uniform Resource Name) for the organization in ConversalyseAuth.
     *
     * @param organizationId The ID of the organization.
     * @returns The URN for the organization.
     * @see {@link organizationUrnPrefix} for the prefix of the URN.
     * @example
     * ```ts
     * buildOrganizationUrn('1') // returns 'urn:conversalyse:organization:1'
     * ```
     */
    export const buildOrganizationUrn: (organizationId: string) => string;
    /**
     * Get the organization ID from the URN (Uniform Resource Name) for the organization in ConversalyseAuth.
     *
     * @param urn The URN for the organization. Must start with {@link organizationUrnPrefix}.
     * @returns The ID of the organization.
     * @throws {TypeError} If the URN is invalid.
     * @example
     * ```ts
     * getOrganizationIdFromUrn('1') // throws TypeError
     * getOrganizationIdFromUrn('urn:conversalyse:organization:1') // returns '1'
     * ```
     */
    export const getOrganizationIdFromUrn: (urn: string) => string;

    export const ContentType: {
        formUrlEncoded: {
            'Content-Type': string;
        };
    };
    export enum TokenGrantType {
        AuthorizationCode = "authorization_code",
        RefreshToken = "refresh_token"
    }
    export enum QueryKey {
        ClientId = "client_id",
        Code = "code",
        CodeChallenge = "code_challenge",
        CodeChallengeMethod = "code_challenge_method",
        CodeVerifier = "code_verifier",
        Error = "error",
        ErrorDescription = "error_description",
        GrantType = "grant_type",
        IdToken = "id_token",
        IdTokenHint = "id_token_hint",
        LoginHint = "login_hint",
        PostLogoutRedirectUri = "post_logout_redirect_uri",
        Prompt = "prompt",
        RedirectUri = "redirect_uri",
        RefreshToken = "refresh_token",
        Resource = "resource",
        ResponseType = "response_type",
        Scope = "scope",
        State = "state",
        /** @deprecated */
        Token = "token",
        /** Need to align with the OIDC extraParams settings in core */
        InteractionMode = "interaction_mode",
        /** The query key for specifying the organization ID. */
        OrganizationId = "organization_id",
        FirstScreen = "first_screen",
        Identifier = "identifier",
        DirectSignIn = "direct_sign_in",
        /** @experimental This might change in future development. Please use with caution. */
        OneTimeToken = "one_time_token"
    }
    /** The prompt parameter to be used for the authorization request. */
    export enum Prompt {
        None = "none",
        /**
         * The Authorization Server MUST prompt the End-User for consent
         * before returning information to the Client.
         */
        Consent = "consent",
        /**
         * The Authorization Server MUST prompt the End-User for re-authentication,
         * forcing the user to log in again. Note the there'll be no Refresh Token
         * returned in this case.
         */
        Login = "login"
    }

    type DirectSignInOptions = {
        /**
         * The method to be used for the direct sign-in.
         */
        method: 'social' | 'sso';
        /**
         * The target to be used for the direct sign-in.
         *
         * - For `method: 'social'`, it should be the social connector target.
         */
        target: string;
    };
    type Identifier = 'email' | 'phone' | 'username';
    type SignInUriParameters = {
        authorizationEndpoint: string;
        clientId: string;
        redirectUri: string;
        codeChallenge: string;
        state: string;
        scopes?: string[];
        resources?: string[];
        prompt?: Prompt | Prompt[];
        /**
         * The first screen to be shown in the sign-in experience.
         */
        firstScreen?: FirstScreen;
        /**
         * Specifies identifiers used in the identifier sign-in, identifier register, and reset password pages.
         *
         * Available values: `email`, `phone`, `username`.
         *
         * This parameter is applicable only when the `firstScreen` is set to either `identifierSignIn` or `identifierRegister`.
         *
         * If the provided identifier is not supported in the ConversalyseAuth sign-in experience configuration, it will be ignored,
         * and if no one of them is supported, it will fallback to the sign-in / sign-up method value set in the sign-in experience configuration.
         *
         */
        identifiers?: Identifier[];
        /**
         * The first screen to be shown in the sign-in experience.
         *
         * @deprecated Use `firstScreen` instead.
         */
        interactionMode?: InteractionMode;
        /**
         * Login hint indicates the current user (usually an email address or a phone number).
         */
        loginHint?: string;
        /**
         * One-time token for the sign-in request.
         *
         * @experimental This might change in future development. Please use with caution.
         */
        oneTimeToken?: string;
        /**
         * Parameters for direct sign-in.
         *
         */
        directSignIn?: DirectSignInOptions;
        /**
         * Extra parameters for the authentication request. Note that the parameters should be supported
         * by the authorization server.
         */
        extraParams?: Record<string, string>;
        /**
         * Whether to include reserved scopes (`openid`, `offline_access` and `profile`) in the scopes.
         *
         * @default true
         */
        includeReservedScopes?: boolean;
    };
    export const generateSignInUri: ({ authorizationEndpoint, clientId, redirectUri, codeChallenge, state, scopes, resources, prompt, firstScreen, identifiers: identifier, interactionMode, loginHint, directSignIn, oneTimeToken, extraParams, includeReservedScopes, }: SignInUriParameters) => string;

    type SignOutUriParameters = {
        endSessionEndpoint: string;
        clientId: string;
        postLogoutRedirectUri?: string;
    };
    export const generateSignOutUri: ({ endSessionEndpoint, clientId, postLogoutRedirectUri, }: SignOutUriParameters) => string;

    type Identity = {
        userId: string;
        details?: Record<string, unknown>;
    };
    type OrganizationData = {
        id: string;
        name: string;
        description: Nullable<string>;
    };
    type UserInfoResponse = IdTokenClaims & {
        custom_data?: unknown;
        identities?: Record<string, Identity>;
        organization_data?: OrganizationData[];
    };
    export const fetchUserInfo: (userInfoEndpoint: string, accessToken: string, requester: Requester) => Promise<UserInfoResponse>;

    export const parseUriParameters: (uri: string) => URLSearchParams;
    export const verifyAndParseCodeFromCallbackUri: (callbackUri: string, redirectUri: string, state: string) => string;

    export const conversalyseErrorCodes: Readonly<{
        'id_token.invalid_iat': "Invalid issued at time in the ID token";
        'id_token.invalid_token': "Invalid ID token";
        'callback_uri_verification.redirect_uri_mismatched': "The callback URI mismatches the redirect URI.";
        'callback_uri_verification.error_found': "Error found in the callback URI";
        'callback_uri_verification.missing_state': "Missing state in the callback URI";
        'callback_uri_verification.state_mismatched': "State mismatched in the callback URI";
        'callback_uri_verification.missing_code': "Missing code in the callback URI";
        crypto_subtle_unavailable: "Crypto.subtle is unavailable in insecure contexts (non-HTTPS).";
        unexpected_response_error: "Unexpected response error from the server.";
    }>;
    type ConversalyseAuthErrorCode = keyof typeof conversalyseErrorCodes;
    export class ConversalyseAuthError extends Error {
        code: ConversalyseAuthErrorCode;
        data?: unknown;
        name: string;
        constructor(code: ConversalyseAuthErrorCode, data?: unknown);
    }
    export const isConversalyseAuthRequestError: (data: unknown) => data is ConversalyseAuthRequestError;
    export const isConversalyseAuthRequestErrorJson: (data: unknown) => data is {
        code: string;
        message: string;
    };
    export class ConversalyseAuthRequestError extends Error {
        code: string;
        /** The original response object from the server. */
        cause?: Response | undefined;
        name: string;
        constructor(code: string, message: string,
            /** The original response object from the server. */
            cause?: Response | undefined);
    }
    export class OidcError {
        error: string;
        errorDescription?: string | undefined;
        name: string;
        constructor(error: string, errorDescription?: string | undefined);
    }

    type IdTokenClaims = {
        /** Issuer of this token. */
        iss: string;
        /** Subject (the user ID) of this token. */
        sub: string;
        /** Audience (the client ID) of this token. */
        aud: string;
        /** Expiration time of this token. */
        exp: number;
        /** Time at which this token was issued. */
        iat: number;
        at_hash?: Nullable<string>;
        /** Full name of the user. */
        name?: Nullable<string>;
        /** Username of the user. */
        username?: Nullable<string>;
        /** URL of the user's profile picture. */
        picture?: Nullable<string>;
        /** Email address of the user. */
        email?: Nullable<string>;
        /** Whether the user's email address has been verified. */
        email_verified?: boolean;
        /** Phone number of the user. */
        phone_number?: Nullable<string>;
        /** Whether the user's phone number has been verified. */
        phone_number_verified?: boolean;
        /** Organization IDs that the user has membership in. */
        organizations?: string[];
        /**
         * All organization roles that the user has. The format is `{organizationId}:{roleName}`.
         *
         * Note that not all organizations are included in this list, only the ones that the user has roles in.
         *
         * @example
         * ```ts
         * ['org1:admin', 'org2:member'] // The user is an admin of org1 and a member of org2.
         * ```
         */
        organization_roles?: string[];
        /** Roles that the user has for API resources. */
        roles?: string[];
    } & Record<string, unknown>;
    export const decodeIdToken: (token: string) => IdTokenClaims;

    type AccessTokenClaims = {
        jti?: string;
        iss?: string;
        sub?: string;
        aud?: string;
        exp?: number;
        iat?: number;
        client_id?: string;
        scope?: string;
    } & Record<string, unknown>;
    export const decodeAccessToken: (accessToken: string) => AccessTokenClaims;

    /**
     * @param originalScopes
     * @return scopes should contain all default scopes (`openid`, `offline_access` and `profile`)
     */
    export const withReservedScopes: (originalScopes?: string[]) => string;
    /**
     * Alias of {@link withReservedScopes}.
     *
     * @deprecated Use {@link withReservedScopes} instead.
     */
    export const withDefaultScopes: (originalScopes?: string[]) => string;

    export const isArbitraryObject: (data: unknown) => data is Record<string, unknown>;

    export { type AccessTokenClaims, type CodeTokenResponse, type ConversalyseAuthErrorCode, ConversalyseAuthRequestError, type ConversalyseAuthRequestErrorBody, type DirectSignInOptions, type FetchTokenByAuthorizationCodeParameters, type FetchTokenByRefreshTokenParameters, type FirstScreen, type IdTokenClaims, type InteractionMode, type OidcConfigResponse, OidcError, Prompt, QueryKey, type RefreshTokenTokenResponse, type Requester, ReservedResource, ReservedScope, type SignInUriParameters, TokenGrantType, type UserClaim, type UserInfoResponse, UserScope, buildOrganizationUrn, decodeAccessToken, decodeIdToken, discoveryPath, fetchOidcConfig, fetchTokenByAuthorizationCode, fetchTokenByRefreshToken, fetchUserInfo, generateSignInUri, generateSignOutUri, getOrganizationIdFromUrn, idTokenClaims, isArbitraryObject, isConversalyseAuthRequestError, isConversalyseAuthRequestErrorJson, organizationUrnPrefix, parseUriParameters, revoke, userClaims, userinfoClaims, verifyAndParseCodeFromCallbackUri, withDefaultScopes, withReservedScopes };

}
declare module '@convnersalyse-auth/client' {
    import { Requester, Prompt, OidcConfigResponse, IdTokenClaims, AccessTokenClaims, UserInfoResponse, SignInUriParameters } from '@convnersalyse-auth/js';
    export { AccessTokenClaims, ConversalyseAuthError, ConversalyseAuthErrorCode, ConversalyseAuthRequestError, IdTokenClaims, InteractionMode, OidcError, Prompt, ReservedResource, ReservedScope, UserInfoResponse, UserScope, buildOrganizationUrn, getOrganizationIdFromUrn, isConversalyseAuthRequestError, organizationUrnPrefix } from '@convnersalyse-auth/js';
    import { Nullable } from '@convnersalyse-auth/essentials';

    /** @deprecated Use {@link PersistKey} instead. */
    type StorageKey = 'idToken' | 'refreshToken' | 'accessToken' | 'signInSession';
    export enum PersistKey {
        IdToken = "idToken",
        RefreshToken = "refreshToken",
        AccessToken = "accessToken",
        SignInSession = "signInSession"
    }
    export enum CacheKey {
        /**
         * OpenID Configuration endpoint response.
         *
         * @see {@link https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderConfigurationResponse | OpenID Connect Discovery 1.0}
         */
        OpenidConfig = "openidConfiguration",
        /**
         * The content of OpenID Provider's `jwks_uri` (JSON Web Key Set).
         *
         * @see {@link https://openid.net/specs/openid-connect-discovery-1_0-21.html#ProviderMetadata | OpenID Connect Discovery 1.0}
         */
        Jwks = "jwks"
    }
    /**
     * The storage object that allows the client to persist data.
     *
     * It's compatible with the `localStorage` API.
     */
    type Storage<Keys extends string> = {
        getItem(key: Keys): Promise<Nullable<string>>;
        setItem(key: Keys, value: string): Promise<void>;
        removeItem(key: Keys): Promise<void>;
    };
    type InferStorageKey<S> = S extends Storage<infer Key> ? Key : never;
    /**
     * The navigation function that redirects the user to the specified URL.
     *
     * @param url The URL to navigate to.
     * @param parameters The parameters for the navigation.
     * @param parameters.redirectUri The redirect URI that the user will be redirected to after the
     * flow is completed. That is, the "redirect URI" for "sign-in" and "post-logout redirect URI" for
     * "sign-out". For the "post-sign-in" navigation, it should be ignored.
     * @param parameters.for The purpose of the navigation. It can be either "sign-in", "sign-out", or
     * "post-sign-in".
     * @remarks Usually, the `redirectUri` parameter can be ignored unless the client needs to pass the
     * redirect scheme or other parameters to the native app, such as `ASWebAuthenticationSession` in
     * iOS.
     */
    type Navigate = (url: string, parameters: {
        redirectUri?: string;
        for: 'sign-in' | 'sign-out' | 'post-sign-in';
    }) => void | Promise<void>;
    type JwtVerifier = {
        verifyIdToken(idToken: string): Promise<void>;
    };
    /**
     * The adapter object that allows the customizations of the client behavior
     * for different environments.
     */
    type ClientAdapter = {
        /**
         * The fetch-like function for network requests.
         *
         * @see {@link Requester}
         */
        requester: Requester;
        /**
         * The storage for storing tokens and sessions. It is usually persistent.
         *
         * @see {@link Requester}
         */
        storage: Storage<StorageKey | PersistKey>;
        /**
         * An optional storage for caching well-known data.
         *
         * @see {@link CacheKey}
         */
        unstable_cache?: Storage<CacheKey>;
        navigate: Navigate;
        /**
         * The function that generates a random state string.
         *
         * @returns The state string.
         */
        generateState: () => string | Promise<string>;
        /**
         * The function that generates a random code verifier string for PKCE.
         *
         * @see {@link https://www.rfc-editor.org/rfc/rfc7636.html | RFC 7636}
         * @returns The code verifier string.
         */
        generateCodeVerifier: () => string | Promise<string>;
        /**
         * The function that generates a code challenge string based on the code verifier
         * for PKCE.
         *
         * @see {@link https://www.rfc-editor.org/rfc/rfc7636.html | RFC 7636}
         * @param codeVerifier The code verifier string.
         * @returns The code challenge string.
         */
        generateCodeChallenge: (codeVerifier: string) => string | Promise<string>;
    };

    export class ClientAdapterInstance implements ClientAdapter {
        requester: Requester;
        storage: Storage<StorageKey | PersistKey>;
        unstable_cache?: Storage<CacheKey> | undefined;
        navigate: Navigate;
        generateState: () => string | Promise<string>;
        generateCodeVerifier: () => string | Promise<string>;
        generateCodeChallenge: (codeVerifier: string) => string | Promise<string>;
        constructor(adapter: ClientAdapter);
        setStorageItem(key: InferStorageKey<typeof this.storage>, value: Nullable<string>): Promise<void>;
        /**
         * Try to get the string value from the cache and parse as JSON.
         * Return the parsed value if it is an object, return `undefined` otherwise.
         *
         * @param key The cache key to get value from.
         */
        getCachedObject<T>(key: CacheKey): Promise<T | undefined>;
        /**
         * Try to get the value from the cache first, if it doesn't exist in cache,
         * run the getter function and store the result into cache.
         *
         * @param key The cache key to get value from.
         */
        getWithCache<T>(key: CacheKey, getter: () => Promise<T>): Promise<T>;
    }

    /** The configuration object for the Conversalyse client. */
    type ConversalyseAuthConfig = {
        /**
         * The endpoint for the Conversalyse server, you can get it from the integration guide
         * or the team settings page of the Conversalyse Console.
         *
         * @example https://foo.conversalyse.app
         */
        endpoint: string;
        /**
         * The discovery path for the Conversalyse server, you can get it from the integration guide
         * or the team settings page of the Conversalyse Console.
         */
        discoveryPath?: string;
        /**
         * The client ID of your application, you can get it from the integration guide
         * or the application details page of the Conversalyse Console.
         */
        appId: string;
        /**
         * The client secret of your application, you can get it from the application
         * details page of the Conversalyse Console.
         */
        appSecret?: string;
        /**
         * The scopes (permissions) that your application needs to access.
         * Scopes that will be added by default: `openid`, `offline_access` and `profile`.
         *
         * If resources are specified, scopes will be applied to every resource.
         *
         * for more information of available scopes for user information.
         */
        scopes?: string[];
        /**
         * The API resources that your application needs to access. You can specify
         * multiple resources by providing an array of strings.
         *
         */
        resources?: string[];
        /**
         * The prompt parameter to be used for the authorization request.
         */
        prompt?: Prompt | Prompt[];
        /**
         * Whether to include reserved scopes (`openid`, `offline_access` and `profile`) in the scopes.
         *
         * @default true
         */
        includeReservedScopes?: boolean;
    };
    /**
     * Normalize the Conversalyse client configuration per the following rules:
     *
     * - Add default scopes (`openid`, `offline_access` and `profile`) if not provided and
     * `includeReservedScopes` is `true`.
     * - Add {@link ReservedResource.Organization} to resources if {@link UserScope.Organizations} is
     * included in scopes.
     *
     * @param config The Conversalyse client configuration to be normalized.
     * @returns The normalized Conversalyse client configuration.
     */
    export const normalizeConversalyseAuthConfig: (config: ConversalyseAuthConfig) => ConversalyseAuthConfig;
    type AccessToken = {
        /** The access token string. */
        token: string;
        /** The scopes that the access token is granted for. */
        scope: string;
        /** The timestamp of the access token expiration. */
        expiresAt: number;
    };
    export const isConversalyseAuthSignInSessionItem: (data: unknown) => data is ConversalyseAuthSignInSessionItem;
    export const isConversalyseAuthAccessTokenMap: (data: unknown) => data is Record<string, AccessToken>;
    type ConversalyseAuthSignInSessionItem = {
        redirectUri: string;
        postRedirectUri?: string;
        codeVerifier: string;
        state: string;
    };

    type SignInOptions = {
        /**
         * The redirect URI that the user will be redirected to after the sign-in flow is completed.
         */
        redirectUri: string | URL;
        /**
         * The URI that the user will be redirected to after `redirectUri` successfully handled the
         * sign-in callback. If not specified, the user will stay on the `redirectUri` page.
         */
        postRedirectUri?: string | URL;
        /**
         * The prompt parameter to be used for the authorization request.
         * Note: If specified, it will override the prompt value in ConversalyseAuth configs.
         */
        prompt?: SignInUriParameters['prompt'];
        /**
         * Clear cached tokens from storage before sign-in. Defaults to: `true`
         */
        clearTokens?: boolean;
    } & Pick<SignInUriParameters, 'interactionMode' | 'firstScreen' | 'identifiers' | 'loginHint' | 'directSignIn' | 'extraParams'>;
    /**
     * The ConversalyseAuth base client class that provides the essential methods for
     * interacting with the ConversalyseAuth server.
     *
     * It also provides an adapter object that allows the customizations of the
     * client behavior for different environments.
     *
     * NOTE: Usually, you would use the `ConversalyseAuthClient` class instead of `StandardConversalyseAuthClient` since it
     * provides the default JWT verifier. However, if you want to avoid the use of `jose` package
     * which is useful for certain environments that don't support native modules like `crypto`, you
     * can use `StandardConversalyseAuthClient` and provide your own JWT verifier.
     */
    export class StandardConversalyseAuthClient {
        #private;
        readonly conversalyseConfig: ConversalyseAuthConfig;
        /**
         * Get the OIDC configuration from the discovery endpoint. This method will
         * only fetch the configuration once and cache the result.
         */
        readonly getOidcConfig: () => Promise<OidcConfigResponse>;
        /**
         * Get the access token from the storage with refresh strategy.
         *
         * - If the access token has expired, it will try to fetch a new one using the Refresh Token.
         * - If there's an ongoing Promise to fetch the access token, it will return the Promise.
         *
         * If you want to get the access token claims, use {@link getAccessTokenClaims} instead.
         *
         * @param resource The resource that the access token is granted for. If not
         * specified, the access token will be used for OpenID Connect or the default
         * resource, as specified in the ConversalyseAuth Console.
         * @returns The access token string.
         * @throws ConversalyseAuthClientError if the user is not authenticated.
         */
        readonly getAccessToken: (this: unknown, resource?: string | undefined, organizationId?: string | undefined) => Promise<string>;
        /**
         * Get the access token for the specified organization from the storage with refresh strategy.
         *
         * Scope {@link UserScope.Organizations} is required in the config to use organization-related
         * methods.
         *
         * @param organizationId The ID of the organization that the access token is granted for.
         * @returns The access token string.
         * @throws ConversalyseAuthClientError if the user is not authenticated.
         * @remarks
         * It uses the same refresh strategy as {@link getAccessToken}.
         */
        readonly getOrganizationToken: (this: unknown, organizationId: string) => Promise<string>;
        /**
         * Clear the access token from the cache storage.
         */
        readonly clearAccessToken: (this: unknown) => Promise<void>;
        /**
         * Clear all cached tokens from storage.
         */
        readonly clearAllTokens: (this: unknown) => Promise<void>;
        /**
         * Handle the sign-in callback by parsing the authorization code from the
         * callback URI and exchanging it for the tokens.
         *
         * @param callbackUri The callback URI, including the search params, that the user is redirected to after the sign-in flow is completed.
         * The origin and pathname of this URI must match the origin and pathname of the redirect URI specified in {@link signIn}.
         * In many cases you'll probably end up passing `window.location.href` as the argument to this function.
         * @throws ConversalyseAuthClientError if the sign-in session is not found.
         */
        readonly handleSignInCallback: (this: unknown, callbackUri: string) => Promise<void>;
        readonly adapter: ClientAdapterInstance;
        protected jwtVerifierInstance: JwtVerifier;
        protected readonly accessTokenMap: Map<string, AccessToken>;
        get jwtVerifier(): JwtVerifier;
        constructor(conversalyseConfig: ConversalyseAuthConfig, adapter: ClientAdapter, buildJwtVerifier: (client: StandardConversalyseAuthClient) => JwtVerifier);
        /**
         * Set the JWT verifier for the client.
         * @param buildJwtVerifier The JWT verifier instance or a function that returns the JWT verifier instance.
         */
        setJwtVerifier(buildJwtVerifier: JwtVerifier | ((client: StandardConversalyseAuthClient) => JwtVerifier)): void;
        /**
         * Check if the user is authenticated by checking if the ID token exists.
         */
        isAuthenticated(): Promise<boolean>;
        /**
         * Get the Refresh Token from the storage.
         */
        getRefreshToken(): Promise<Nullable<string>>;
        /**
         * Get the ID Token from the storage. If you want to get the ID Token claims,
         * use {@link getIdTokenClaims} instead.
         */
        getIdToken(): Promise<Nullable<string>>;
        /**
         * Get the ID Token claims.
         */
        getIdTokenClaims(): Promise<IdTokenClaims>;
        /**
         * Get the access token claims for the specified resource.
         *
         * @param resource The resource that the access token is granted for. If not
         * specified, the access token will be used for OpenID Connect or the default
         * resource, as specified in the ConversalyseAuth Console.
         */
        getAccessTokenClaims(resource?: string): Promise<AccessTokenClaims>;
        /**
         * Get the organization token claims for the specified organization.
         *
         * @param organizationId The ID of the organization that the access token is granted for.
         */
        getOrganizationTokenClaims(organizationId: string): Promise<AccessTokenClaims>;
        /**
         * Get the user information from the Userinfo Endpoint.
         *
         * Note the Userinfo Endpoint will return more claims than the ID Token. See
         * for more information.
         *
         * @returns The user information.
         * @throws ConversalyseAuthClientError if the user is not authenticated.
         */
        fetchUserInfo(): Promise<UserInfoResponse>;
        /**
         * Start the sign-in flow with the specified options.
         *
         * The redirect URI is required and it must be registered in the ConversalyseAuth Console.
         *
         * The user will be redirected to that URI after the sign-in flow is completed,
         * and the client will be able to get the authorization code from the URI.
         * To fetch the tokens from the authorization code, use {@link handleSignInCallback}
         * after the user is redirected in the callback URI.
         *
         * @param options The options for the sign-in flow.
         */
        signIn(options: SignInOptions): Promise<void>;
        /**
         * Start the sign-in flow with the specified options.
         *
         * The redirect URI is required and it must be registered in the ConversalyseAuth Console.
         *
         * The user will be redirected to that URI after the sign-in flow is completed,
         * and the client will be able to get the authorization code from the URI.
         * To fetch the tokens from the authorization code, use {@link handleSignInCallback}
         * after the user is redirected in the callback URI.
         *
         * @param redirectUri See {@link SignInOptions.redirectUri}.
         */
        signIn(redirectUri: SignInOptions['redirectUri']): Promise<void>;
        /**
         *
         * Start the sign-in flow with the specified redirect URI. The URI must be
         * registered in the ConversalyseAuth Console.
         *
         * The user will be redirected to that URI after the sign-in flow is completed,
         * and the client will be able to get the authorization code from the URI.
         * To fetch the tokens from the authorization code, use {@link handleSignInCallback}
         * after the user is redirected in the callback URI.
         *
         * @deprecated Use the object parameter instead.
         * @param redirectUri See {@link SignInOptions.redirectUri}.
         * @param interactionMode See {@link SignInOptions.interactionMode}.
         * @param loginHint See {@link SignInOptions.loginHint}.
         */
        signIn(redirectUri: SignInOptions['redirectUri'], interactionMode?: SignInOptions['interactionMode'], loginHint?: SignInOptions['loginHint']): Promise<void>;
        /**
         * Check if the user is redirected from the sign-in page by checking if the
         * current URL matches the redirect URI in the sign-in session.
         *
         * If there's no sign-in session, it will return `false`.
         *
         * @param url The current URL.
         */
        isSignInRedirected(url: string): Promise<boolean>;
        /**
         * Check if the user is redirected from the sign-in page with the authorization code
         * by checking if the current URL matches the redirect URI in the sign-in session
         * and if the URL contains the `code` and `state` parameters.
         * @param url The current URL.
         */
        isCallbackSignInRedirected(url: string): Promise<boolean>;
        /**
         * Start the sign-out flow with the specified redirect URI. The URI must be
         * registered in the ConversalyseAuth Console.
         *
         * It will also revoke all the tokens and clean up the storage.
         *
         * The user will be redirected that URI after the sign-out flow is completed.
         * If the `postLogoutRedirectUri` is not specified, the user will be redirected
         * to a default page.
         */
        signOut(postLogoutRedirectUri?: string): Promise<void>;
        protected getSignInSession(): Promise<Nullable<ConversalyseAuthSignInSessionItem>>;
        protected setSignInSession(value: Nullable<ConversalyseAuthSignInSessionItem>): Promise<void>;
        private setIdToken;
        private setRefreshToken;
        private getAccessTokenByRefreshToken;
        private saveAccessTokenMap;
        private loadAccessTokenMap;
        getCodeAndStateFromCallbackUri(callbackUri: string): Promise<{
            code: string;
            redirectUri: string;
            postRedirectUri: string | undefined;
            state: string;
            codeVerifier: string;
            accessTokenKey: string;
            clientId: string;
            tokenEndpoint: string;
            requestedAt: number;
        }>;
    }

    export const conversalyseClientErrorCodes: Readonly<{
        'sign_in_session.invalid': "Invalid sign-in session.";
        'sign_in_session.not_found': "Sign-in session not found.";
        not_authenticated: "Not authenticated.";
        fetch_user_info_failed: "Unable to fetch user info. The access token may be invalid.";
        user_cancelled: "The user cancelled the action.";
        missing_scope_organizations: "The `urn:conversalyse:scope:organizations` scope is required";
    }>;
    type ConversalyseAuthClientErrorCode = keyof typeof conversalyseClientErrorCodes;
    export class ConversalyseAuthClientError extends Error {
        name: string;
        code: ConversalyseAuthClientErrorCode;
        data: unknown;
        constructor(code: ConversalyseAuthClientErrorCode, data?: unknown);
    }

    /**
     * A factory function that creates a requester by accepting a `fetch`-like function.
     *
     * @param fetchFunction A `fetch`-like function.
     * @returns A requester function.
     * @see {@link Requester}
     */
    export const createRequester: (fetchFunction: typeof fetch) => Requester;

    /**
     * The ConversalyseAuth base client class that provides the essential methods for
     * interacting with the ConversalyseAuth server.
     *
     * It also provides an adapter object that allows the customizations of the
     * client behavior for different environments.
     */
    export class ConversalyseAuthClient extends StandardConversalyseAuthClient {
        constructor(conversalyseConfig: ConversalyseAuthConfig, adapter: ClientAdapter, buildJwtVerifier?: (client: StandardConversalyseAuthClient) => JwtVerifier);
    }

    export { type AccessToken, type ClientAdapter, type ConversalyseAuthClientErrorCode, type ConversalyseAuthConfig, type ConversalyseAuthSignInSessionItem, type JwtVerifier, type SignInOptions, type Storage, type StorageKey, ConversalyseAuthClient as default };
}
declare module '@convnersalyse-auth/browser' {
    import BaseClient, { Storage, StorageKey, ConversalyseAuthConfig } from '@convnersalyse-auth/client';
    export { AccessTokenClaims, default as BaseClient, ClientAdapter, ConversalyseAuthClientError, ConversalyseAuthClientErrorCode, ConversalyseAuthConfig, ConversalyseAuthError, ConversalyseAuthErrorCode, ConversalyseAuthRequestError, IdTokenClaims, InteractionMode, OidcError, PersistKey, Prompt, ReservedResource, ReservedScope, SignInOptions, Storage, UserInfoResponse, UserScope, buildOrganizationUrn, createRequester, getOrganizationIdFromUrn, isConversalyseAuthRequestError, organizationUrnPrefix } from '@convnersalyse-auth/client';
    import { Nullable } from '@silverhand/essentials';


    /** @link [Proof Key for Code Exchange by OAuth Public Clients](https://datatracker.ietf.org/doc/html/rfc7636) */
    /**
     * Generates random string for state and encodes them in url safe base64
     */
    export const generateState: () => string;
    /**
     * Generates code verifier
     *
     * @link [Client Creates a Code Verifier](https://datatracker.ietf.org/doc/html/rfc7636#section-4.1)
     */
    export const generateCodeVerifier: () => string;
    /**
     * Calculates the S256 PKCE code challenge for an arbitrary code verifier and encodes it in url safe base64
     *
     * @param {String} codeVerifier Code verifier to calculate the S256 code challenge for
     * @link [Client Creates the Code Challenge](https://datatracker.ietf.org/doc/html/rfc7636#section-4.2)
     */
    export const generateCodeChallenge: (codeVerifier: string) => Promise<string>;

    export class BrowserStorage implements Storage<StorageKey> {
        readonly appId: string;
        constructor(appId: string);
        getKey(item?: string): string;
        getItem(key: StorageKey): Promise<Nullable<string>>;
        setItem(key: StorageKey, value: string): Promise<void>;
        removeItem(key: StorageKey): Promise<void>;
    }

    export class Client extends BaseClient {
        /**
         * @param config The configuration object for the client.
         * @param [unstable_enableCache=false] Whether to enable cache for well-known data.
         * Use sessionStorage by default.
         */
        constructor(config: ConversalyseAuthConfig, unstable_enableCache?: boolean);
        /**
         * Remove specific query param(s) from the current URL without refreshing.
         *
         * - Keeps order and original encoding of **unaffected** params.
         * - Matches on both raw and decoded names (so "foo%5B%5D" matches "foo[]").
         * - Uses URL/URLSearchParams when available, with a careful legacy fallback.
         * - No-op (returns false) if `history.replaceState` is unavailable or nothing changes.
         *
         * @example
         * stripQueryParams("token");                                // remove ?token=...
         * stripQueryParams(["debug", "utm_source"]);                // remove multiple
         * stripQueryParams(["x"], { preserveHash: false });         // also clears hash
         *
         * @param names Single name or array of names to remove (case-sensitive).
         * @param opts Options (see {@link StripOptions})
         * @returns `true` if the address bar was updated, otherwise `false`.
         */
        stripQueryParams(names: string | string[], opts?: StripOptions): boolean;
    }
    /** Options shared by both functions. */
    export interface StripOptions {
        /** Keep the #fragment (default: true). */
        preserveHash?: boolean;
    }
    export { Client as default };

}

declare var ConversalyseAuth: typeof import('@convnersalyse-auth/browser'); 
