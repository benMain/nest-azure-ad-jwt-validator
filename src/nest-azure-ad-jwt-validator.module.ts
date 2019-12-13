import { Module, HttpModule, Global, DynamicModule } from '@nestjs/common';
import { AzureTokenValidationService } from './azure-token-validation/azure-token-validation.service';
import { AzureActiveDirectoryGuard } from './guards/azure-active-directory.guard';
import { AUDIENCE_TOKEN, TENANT_TOKEN } from './constants';

@Global()
@Module({
  imports: [HttpModule],
  controllers: [],
  providers: [AzureTokenValidationService, AzureActiveDirectoryGuard],
  exports: [AzureTokenValidationService, AzureActiveDirectoryGuard],
})
export class NestAzureAdJwtValidatorModule {
  static forRoot(tenantId: string, applicationId: string): DynamicModule {
    return {
      module: NestAzureAdJwtValidatorModule,
      providers: [
        AzureTokenValidationService,
        AzureActiveDirectoryGuard,
        {
          provide: AUDIENCE_TOKEN,
          useValue: applicationId,
        },
        {
          provide: TENANT_TOKEN,
          useValue: tenantId,
        },
      ],
      exports: [AzureTokenValidationService, AzureActiveDirectoryGuard],
    };
  }
}
