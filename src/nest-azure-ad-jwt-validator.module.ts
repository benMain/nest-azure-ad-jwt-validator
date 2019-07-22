import { Module, HttpModule, Global } from '@nestjs/common';
import { AzureTokenValidationService } from './azure-token-validation/azure-token-validation.service';
import { AzureActiveDirectoryGuard } from './guards/azure-active-directory.guard';

@Global()
@Module({
  imports: [HttpModule],
  controllers: [],
  providers: [AzureTokenValidationService, AzureActiveDirectoryGuard],
  exports: [AzureTokenValidationService, AzureActiveDirectoryGuard],
})
export class NestAzureAdJwtValidatorModule {}
