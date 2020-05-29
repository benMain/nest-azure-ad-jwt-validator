import { AUDIENCE_TOKEN, TENANT_TOKEN } from '../constants';
import { AzureAdUser, JwtKey, JwtPayload, TokenHeader } from '../models';
import { HttpService, Inject, Injectable, Logger } from '@nestjs/common';

import { EOL } from 'os';
import { verify } from 'jsonwebtoken';

@Injectable()
export class AzureTokenValidationService {
  private readonly serviceTokenEnvVariable = 'SERVICE_TOKEN';
  private readonly logger: Logger;
  constructor(
    private readonly httpService: HttpService,
    @Inject(AUDIENCE_TOKEN) private readonly audience: string,
    @Inject(TENANT_TOKEN) private readonly tenant: string,
  ) {
    this.logger = new Logger(AzureTokenValidationService.name);
  }

  async isTokenValid(accessToken: string): Promise<boolean> {
    let isTokenValid = !!(await this.extractUserFromToken(accessToken));
    if (!isTokenValid) {
      isTokenValid = this.validateServiceToken(accessToken);
    }
    return isTokenValid;
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
    } catch (err) {
      this.logger.error(
        `Unable to extract Header from AccessToken: ${accessToken} for issue ${err.toString()}`,
      );
      return null;
    }
    const key = keys.find(x => x.kid === tokenHeader.kid);
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
      if (user.audience === this.audience && user.tenant === this.tenant) {
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
    return (await this.httpService
      .get<{ keys: JwtKey[] }>(
        'https://login.microsoftonline.com/common/discovery/keys',
      )
      .toPromise()).data;
  }

  private verifyToken(accessToken: string, key: string): JwtPayload {
    return verify(accessToken, key) as JwtPayload;
  }

  private getTokenHeader(accessToken: string): TokenHeader {
    const tokenPart = accessToken.slice(0, accessToken.indexOf('.'));
    const buffer = Buffer.from(tokenPart, 'base64');
    const decodedToken = buffer.toString('utf8');
    return JSON.parse(decodedToken) as TokenHeader;
  }

  private validateServiceToken(token: string): boolean {
    this.logger.log('Attempting to validate service token...');
    if (process.env[this.serviceTokenEnvVariable] === token) {
      return true;
    } else {
      this.logger.error('Could not validate service token.');
      return false;
    }
  }
}
