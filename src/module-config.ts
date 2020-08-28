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
    this.apps = this.apps.filter(x => !!x);

    if (!this.serviceTokens?.length) {
      this.serviceTokens = [];
    }
    this.serviceTokens.push(process.env.SERVICE_TOKEN);
    this.serviceTokens = this.serviceTokens.filter(x => !!x);

    this.enableDebugLogs = !!this.enableDebugLogs;
  }
}
