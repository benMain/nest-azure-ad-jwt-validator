# Nest Azure Active Directory Token Validator

<p align="center">
  <a href="https://docs.microsoft.com/en-us/azure/active-directory/develop/access-tokens#validating-tokens" target="blank"><img src="./azure-active-directory.svg" width="320" alt="Azure Ad Logo" /></a>
</p>

## Description

[Nest](https://github.com/nestjs/nest) framework Module for validating Azure AD JWT Tokens. <br/>
The Module exports an [AzureTokenValidationService](./src/azure-token-validation/azure-token-validation.service.ts) for validating tokens
as well as a guard you might consider using [AzureActiveDirectoryGuard](./src/guards/zure-active-directory.guard.ts). <br/>
Note: The exported guard expects the jwt(json web token) in an authtoken header (in Aws APIGateway we don't like to mess with the Authorization header).

## Installation

```bash
$ npm install --save nest-azure-ad-jwt-validator
```

## Test

```bash
# unit tests
$ npm run test

# test coverage
$ npm run test:cov
```

## Stay in touch

- Author - [Benjamin Main](mailto:bmain@lumeris.com)

## License

nest-azure-ad-jwt-validator is [MIT licensed](LICENSE).
