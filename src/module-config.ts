import { DynamicModule, FactoryProvider, ValueProvider } from '@nestjs/common';

export interface ImportableFactoryProvider<T>
  extends Omit<FactoryProvider<T>, 'provide'>,
    Pick<DynamicModule, 'imports'> {}

export type AsyncProvider<T> =
  | ImportableFactoryProvider<T>
  | Omit<ValueProvider<T>, 'provide'>;

/**
 * An interface representing the shape of the tenant and app you are wanting to authenticate against.
 */
export interface TenantApplication {
  tenantId: string;
  audienceId: string;
}

export class NestAzureAdJwtValidatorModuleOptions {
  /**
   * The apps in question
   */
  apps: TenantApplication[];
  /**
   * Service Tokens allow you to shortcut jwt authentication for clients that are unsophisticated
   */
  serviceTokens?: string[];
  /**
   * Enable Debug Logging
   */
  enableDebugLogs?: boolean;
  /**
   * Which header does the jwt appear in? If unspecified... defaults to authtoken header.
   */
  tokenHeader?: string;

  constructor(partial: Partial<NestAzureAdJwtValidatorModuleOptions>) {
    Object.assign(this, partial);

    if (!this.apps?.length) {
      this.apps = [];
    }
    this.apps = this.apps.filter((x) => !!x);

    if (!this.serviceTokens?.length) {
      this.serviceTokens = [];
    }
    this.serviceTokens.push(process.env.SERVICE_TOKEN);
    this.serviceTokens = this.serviceTokens.filter((x) => !!x);

    this.enableDebugLogs = !!this.enableDebugLogs;
    this.tokenHeader = partial.tokenHeader;
  }
}
