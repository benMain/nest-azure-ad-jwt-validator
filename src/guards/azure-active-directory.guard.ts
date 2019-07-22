import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AzureTokenValidationService } from '../azure-token-validation';
import { IncomingMessage } from 'http';

@Injectable()
export class AzureActiveDirectoryGuard implements CanActivate {
  constructor(
    private readonly tokenValidationService: AzureTokenValidationService,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const token = this.parseTokenFromContext(context);
    return this.tokenValidationService.isTokenValid(token);
  }

  private parseTokenFromContext(context: ExecutionContext): string {
    const request = context.switchToHttp().getRequest<IncomingMessage>();
    const tokenHeader = request.headers.authtoken;
    return (!!tokenHeader ? tokenHeader.toString() : '')
      .trim()
      .split(' ')
      .pop();
  }
}
