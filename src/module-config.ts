export interface TenantApplication {
  tenantId: string;
  audienceId: string;
}

export class NestAzureAdJwtValidatorModuleOptions {
  apps: TenantApplication[];
  serviceTokens?: string[];
  enableDebugLogs?: boolean;

  constructor(partial: Partial<NestAzureAdJwtValidatorModuleOptions>) {
    Object.assign(this, partial);

    if (!this.apps?.length) {
      this.apps = [];
    }

    if (!this.serviceTokens?.length) {
      this.serviceTokens = [];
    }

    this.enableDebugLogs = !!this.enableDebugLogs;

    const defaultEnvServiceToken = process.env.SERVICE_TOKEN;
    if (defaultEnvServiceToken?.length) {
      this.serviceTokens.push(defaultEnvServiceToken);
    }
  }
}
