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

## Usage

1. Import the module globally in your app module.
2. Add the Exported Guard as a global guard or use the exported service

```typescript
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
  AzureActiveDirectoryGuard,
  NestAzureAdJwtValidatorModule,
} from 'nest-azure-ad-jwt-validator';

@Module({
  imports: [
    NestAzureAdJwtValidatorModule.forRoot(
      '63fca94a-4979-4ee1-b9cc-54569f68ccbf', // tenantId
      '6747e462-323d-4fb7-b1e0-fe99531fe611', // applicationId
    ),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AzureActiveDirectoryGuard,
    },
  ],
})
export class AppModule {}
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
