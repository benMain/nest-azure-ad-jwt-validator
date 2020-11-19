import { AzureAdUser, JwtKey, JwtPayload, TokenHeader } from '../models';
import { HttpService, Inject, Injectable, Logger } from '@nestjs/common';

import { EOL } from 'os';
import { NestAzureAdJwtValidatorModuleOptions } from '../module-config';
import { verify } from 'jsonwebtoken';

@Injectable()
export class AzureTokenValidationService {
  private readonly logger: Logger;

  constructor(
    private readonly httpService: HttpService,
    private readonly options: NestAzureAdJwtValidatorModuleOptions,
  ) {
    this.logger = new Logger(AzureTokenValidationService.name);
  }

  async isTokenValid(
    accessToken: string,
  ): Promise<[boolean, AzureAdUser, boolean]> {
    let isServiceToken = false;
    const user = await this.extractUserFromToken(accessToken);
    let isTokenValid = !!user;
    if (!isTokenValid) {
      isServiceToken = true;
      isTokenValid = this.validateServiceToken(accessToken);
    }
    return [isTokenValid, user, isServiceToken];
  }

  async getAzureUserFromToken(accessToken: string): Promise<AzureAdUser> {
    return await this.extractUserFromToken(accessToken);
  }

  private async extractUserFromToken(
    accessToken: string,
  ): Promise<AzureAdUser> {
    const keys = (await this.getAzureKeys()).keys;
    let tokenHeader: TokenHeader;
    try {
      tokenHeader = this.getTokenHeader(accessToken);
      if (!tokenHeader) {
        return null;
      }
    } catch (err) {
      if (this.options.enableDebugLogs) {
        this.logger.warn(
          `Unable to extract Header from AccessToken: ${accessToken} for issue ${err.toString()}`,
        );
      }
      return null;
    }
    const key = keys.find((x) => x.kid === tokenHeader.kid);
    if (!key) {
      this.logger.error(
        `Unable to find Public Signing key matching Token Header kid(KeyId): ${tokenHeader.kid}`,
      );
      return null;
    }
    const publicKey = `-----BEGIN CERTIFICATE-----${EOL}${key.x5c[0]}${EOL}-----END CERTIFICATE-----`;
    try {
      const payload = this.verifyToken(accessToken, publicKey);
      const user = new AzureAdUser(payload);
      const matchingTenantApp = this.options.apps.some(
        (a) =>
          (a.audienceId === user.audience || a.audienceId === user.appId) &&
          a.tenantId === user.tenant,
      );
      return matchingTenantApp ? user : null;
    } catch (err) {
      this.logger.error(
        `Unable to validate accessToken for reason ${err.toString()}`,
      );
      return null;
    }
  }

  async extractRolesFromToken(accessToken: string): Promise<AzureAdUser> {
    const keys = (await this.getAzureKeys()).keys;
    let tokenHeader: TokenHeader;
    try {
      tokenHeader = this.getTokenHeader(accessToken);
      if (!tokenHeader) {
        return null;
      }
    } catch (err) {
      this.logger.error(
        `Unable to extract Header from AccessToken: ${accessToken} for issue ${err.toString()}`,
      );
      return null;
    }
    const key = keys.find((x) => x.kid === tokenHeader.kid);
    if (!key) {
      this.logger.error(
        `Unable to find Public Signing key matching Token Header kid(KeyId): ${tokenHeader.kid}`,
      );
      return null;
    }
    const publicKey = `-----BEGIN CERTIFICATE-----${EOL}${key.x5c[0]}${EOL}-----END CERTIFICATE-----`;
    try {
      const payload = this.verifyToken(accessToken, publicKey);
      const user = new AzureAdUser(payload);
      if (user.roles) {
        return user;
      }
      return null;
    } catch (err) {
      this.logger.error(
        `Unable to validate accessToken for reason ${err.toString()}`,
      );
      return null;
    }
  }

  private async getAzureKeys(): Promise<{ keys: JwtKey[] }> {
    return (
      await this.httpService
        .get<{ keys: JwtKey[] }>(
          'https://login.microsoftonline.com/common/discovery/keys',
        )
        .toPromise()
    ).data;
  }

  private verifyToken(
    accessToken: string,
    key: string,
  ): JwtPayload & { appid?: string } {
    const data = verify(accessToken, key);
    return data as JwtPayload;
  }

  private getTokenHeader(accessToken: string): TokenHeader {
    if (!accessToken.includes('.')) {
      this.logger.debug('Processing as service token, not as access token.');
      return null;
    }
    const tokenPart = accessToken.slice(0, accessToken.indexOf('.'));
    const buffer = Buffer.from(tokenPart, 'base64');
    const decodedToken = buffer.toString('utf8');
    try {
      return JSON.parse(decodedToken) as TokenHeader;
    } catch (ex) {
      this.logger.debug('Processing as service token, not as access token.');
      return null;
    }
  }

  private validateServiceToken(token: string): boolean {
    if (this.options.enableDebugLogs) {
      this.logger.debug('Attempting to validate service token...');
    }

    if (this.options.serviceTokens.includes(token)) {
      return true;
    }

    if (this.options.enableDebugLogs) {
      this.logger.warn('Could not validate service token.');
    }

    return false;
  }
}
