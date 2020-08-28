import { DynamicModule, Global, HttpModule, Module } from '@nestjs/common';

import { AzureActiveDirectoryGuard } from './guards/azure-active-directory.guard';
import { AzureTokenValidationService } from './azure-token-validation/azure-token-validation.service';
import { NestAzureAdJwtValidatorModuleOptions } from './module-config';

@Global()
@Module({
  imports: [HttpModule],
  controllers: [],
  providers: [AzureTokenValidationService, AzureActiveDirectoryGuard],
  exports: [AzureTokenValidationService, AzureActiveDirectoryGuard],
})
export class NestAzureAdJwtValidatorModule {
  static forRoot(
    options: Partial<NestAzureAdJwtValidatorModuleOptions>,
  ): DynamicModule {
    return {
      module: NestAzureAdJwtValidatorModule,
      providers: [
        AzureTokenValidationService,
        AzureActiveDirectoryGuard,
        {
          provide: NestAzureAdJwtValidatorModuleOptions,
          useValue: new NestAzureAdJwtValidatorModuleOptions(options),
        },
      ],
      exports: [
        AzureTokenValidationService,
        AzureActiveDirectoryGuard,
        NestAzureAdJwtValidatorModuleOptions,
      ],
    };
  }
}
