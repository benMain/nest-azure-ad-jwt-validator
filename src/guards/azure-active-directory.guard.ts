import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';

import { AzureTokenValidationService } from '../azure-token-validation';
import { IncomingMessage } from 'http';
import { Reflector } from '@nestjs/core';

@Injectable()
export class AzureActiveDirectoryGuard implements CanActivate {
  private readonly logger = new Logger(AzureActiveDirectoryGuard.name);
  constructor(
    private reflector: Reflector,
    private readonly tokenValidationService: AzureTokenValidationService,
  ) { }

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const accessToken = this.parseTokenFromContext(context);
    const isTokenValid = await this.tokenValidationService.isTokenValid(accessToken);
    // token is not valid exit
    if (!isTokenValid) {
      return false;
    }
    try {
      const roles = this.reflector.get('roles', context.getHandler());
      // no roles and token is valid return success
      if (!roles) {
        return true;
      }
      const user = await this.tokenValidationService.extractRolesFromToken(accessToken);
      return this.matchRoles(roles, user.roles);
    } catch (ex) {
      return true;
    }
  }

  private parseTokenFromContext(context: ExecutionContext): string {
    const request = context.switchToHttp().getRequest<IncomingMessage>();
    const tokenHeader = request.headers.authtoken;
    return (!!tokenHeader ? tokenHeader.toString() : '')
      .trim()
      .split(' ')
      .pop();
  }

  private matchRoles(roles: string[], usersRoles: string[]) {
    const userRolesLower = usersRoles.map((key) => key.toLowerCase());
    for (const role of roles) {
      if (userRolesLower.includes(role.toLowerCase())) {
        return true;
      }
    }
    return false;
  }
}
