import { AUDIENCE_TOKEN, TENANT_TOKEN } from '../constants';
import { ExecutionContext, HttpService, SetMetadata } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AzureActiveDirectoryGuard } from './azure-active-directory.guard';
import { AzureTokenValidationService } from '../azure-token-validation';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

describe('AzureActiveDirectoryGuard', () => {
  let guard: AzureActiveDirectoryGuard;
  let service: AzureTokenValidationService;
  let tokenValidateMock: jest.SpyInstance<Promise<boolean>, [string]>;
  let executionContext: ExecutionContext;
  const audienceToken = 'ff45a46b-5dc8-4f5e-ae2d-f92f978deade';
  const tenantToken = '1f698e30-434c-4488-a068-fb417df97dc4';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AzureActiveDirectoryGuard,
        AzureTokenValidationService,
        {
          provide: AUDIENCE_TOKEN,
          useValue: audienceToken,
        },
        {
          provide: TENANT_TOKEN,
          useValue: tenantToken,
        },
        {
          provide: HttpService,
          useValue: {
            get: () => null,
          },
        },
      ],
    }).compile();
    guard = module.get<AzureActiveDirectoryGuard>(AzureActiveDirectoryGuard);
    service = module.get<AzureTokenValidationService>(
      AzureTokenValidationService,
    );
    tokenValidateMock = jest.spyOn(service, 'isTokenValid');
    const incomingRequest: any = {
      headers: {
        authtoken: '12345A',
      },
    };
    executionContext = {
      getType: () => null,
      getHandler: () => null,
      getClass: () => null,
      getArgByIndex: () => null,
      getArgs: () => null,
      switchToRpc: () => null,
      switchToWs: () => null,
      switchToHttp: () => ({
        getRequest: () => incomingRequest,
        getResponse: () => null,
        getNext: () => null,
      }),
    };
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });
  describe('canActivate()', () => {
    it('should activate for valid token', async () => {
      tokenValidateMock.mockReturnValue(Promise.resolve(true));
      const canActivate = await guard.canActivate(executionContext);
      expect(canActivate).toEqual(true);
      expect(tokenValidateMock).toHaveBeenCalledTimes(1);
      expect(tokenValidateMock).toHaveBeenCalledWith('12345A');
    });
  });
});
