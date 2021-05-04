import {
  AsyncProvider,
  ImportableFactoryProvider,
  NestAzureAdJwtValidatorModuleOptions,
} from './module-config';
import { DynamicModule, Global, HttpModule, Module } from '@nestjs/common';

import { AzureActiveDirectoryGuard } from './guards/azure-active-directory.guard';
import { AzureTokenValidationService } from './azure-token-validation/azure-token-validation.service';

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

  static forRootAsync(
    options: AsyncProvider<
      | Partial<NestAzureAdJwtValidatorModuleOptions>
      | Promise<Partial<NestAzureAdJwtValidatorModuleOptions>>
    >,
  ): DynamicModule {
    const configToken = 'AZURE_CONFIG';
    const module: DynamicModule = {
      global: true,
      module: NestAzureAdJwtValidatorModule,
      imports: [],
      providers: [
        AzureTokenValidationService,
        AzureActiveDirectoryGuard,
        {
          provide: NestAzureAdJwtValidatorModuleOptions,
          useFactory: async (
            config: Partial<NestAzureAdJwtValidatorModuleOptions>,
          ) => {
            return new NestAzureAdJwtValidatorModuleOptions(config);
          },
          inject: [configToken],
        },
      ],
      exports: [
        AzureTokenValidationService,
        AzureActiveDirectoryGuard,
        NestAzureAdJwtValidatorModuleOptions,
      ],
    };

    this.addAsyncProvider<Partial<NestAzureAdJwtValidatorModuleOptions>>(
      module,
      configToken,
      options,
      false,
    );
    return module;
  }

  private static addAsyncProvider<T>(
    module: DynamicModule,
    provide: string,
    asyncProvider: AsyncProvider<T | Promise<T>>,
    exportable: boolean,
  ) {
    const imports = (asyncProvider as ImportableFactoryProvider<T>).imports;
    if (imports?.length) {
      imports.forEach((i) => module.imports.push(i));
    }
    delete (asyncProvider as ImportableFactoryProvider<T>).imports;

    module.providers.push({
      ...asyncProvider,
      provide,
    });

    if (exportable) {
      module.exports.push(provide);
    }
  }
}
