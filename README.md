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
import {
  AzureActiveDirectoryGuard,
  NestAzureAdJwtValidatorModule,
} from 'nest-azure-ad-jwt-validator';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Module } from '@nestjs/common';
@Module({
  imports: [
    NestAzureAdJwtValidatorModule.forRoot(
      '63fca94a-4979-4ee1-b9cc-54569f68ccbf', // tenantId
      '6747e462-323d-4fb7-b1e0-fe99531fe611', // applicationId
      false, // optional - enable debug logs, default false
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

## Azure Roles

1.

To use azure roles go to portal.azure.com -> search for App Registrations -> find your app -> edit manifest

Add your roles to the manifest, the id's should be different Guids:

```json
{
	"id": "xxxx-xxxx-xx-xxxx-xxxxxxx",
	...
	"appRoles": [
		{
			"allowedMemberTypes": [
				"User"
			],
			"description": "Admin Users",
			"displayName": "Admin",
			"id": "xxxxx-xxxx-xxx-xxx-xxxxxx",
			"isEnabled": true,
			"lang": null,
			"origin": "Application",
			"value": "Admin"
		},
		{
			"allowedMemberTypes": [
				"User"
			],
			"description": "Finance Users have the ability to update finance data.",
			"displayName": "FinanceUsers",
			"id": "xxxxxx-xxx-xxxx-xxxx-xxxxxx2",
			"isEnabled": true,
			"lang": null,
			"origin": "Application",
			"value": "FinanceUsers"
    },
    ...
	],
	"oauth2AllowUrlPathMatching": false,
	...
}
```

2.

Next go to Enterprise Applications -> search for your app and click on it for details -> Users and Groups (or Assign Users and Groups) -> Add User -> Here you pick azure ad users or groups and put them into the App Roles

3.

Now that Azure roles are setup and returned in the token, roles can be added to the application under the routes such as

```ts
import { Controller, Get } from '@nestjs/common';
import { Roles } from 'nest-azure-ad-jwt-validator';
@Controller('test')
export class TestController {
  @Get('')
  @Roles('admin', 'finance')
  get getTest() {
    return 'success';
  }
}
```

Note: Azure Roles have not been setup an a `@Controller` level that will require a code change to `context.getHandler()` -> `context.getClass()`

Note: If the role does not exist on the role, no roles are checked and everything proceeds as if there are no roles.

Note: If you are assigning users to appRoles via Azure Groups then you need to change the manifest

```json
"groupMembershipClaims": null,
```

To

```json
"groupMembershipClaims": "All", # or “SecurityGroups”
```

In addition you cannot nest security groups, so [you cannot take an existing group and add it to the group assigned to the appRole](https://stackoverflow.com/questions/27633510/assign-nested-group-to-role-in-azure-ad-applications-users-and-groups).

Example:
appRole: 'Admin'
User: 'test@domain.com'
AD Groups: 'AD-TEST-UI-UG'

Either add ADGroups to the appRole or add the user to the appRole. You cannot add the AD Group 'AD-TEST-UI-UG' to another AD Group superset ('AD-TEST-UI-SUPERSET-UG') group. 'AD-TEST-UI-SUPERSET-UG' would never show roles.

Also:
[Vote for this Feature](https://feedback.azure.com/forums/169401-azure-active-directory/suggestions/)15718164-add-support-for-nested-groups-in-azure-ad-app-acc
[In the Important section](https://docs.microsoft.com/en-us/azure/active-directory/users-groups-roles/groups-saasapps)

## Commit Messages

Commit messages should follow the [semantic commit message by angular(https://nitayneeman.com/posts/understanding-semantic-commit-messages-using-git-and-angular/)

```bash
git commit -am "fix(roles): add service token except to roles authorization" -m "The roles authorization should not run when the service now token is used because the service token is used when the application has no auth mechanism. Add warning message if user's roles does not match expected role" -m "PR Close #13"
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
