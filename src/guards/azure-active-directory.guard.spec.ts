import { AzureActiveDirectoryGuard } from './azure-active-directory.guard';
import { Test, TestingModule } from '@nestjs/testing';
import { AzureTokenValidationService } from '../azure-token-validation';
import { ExecutionContext, HttpService } from '@nestjs/common';

describe('AzureActiveDirectoryGuard', () => {
  let guard: AzureActiveDirectoryGuard;
  let service: AzureTokenValidationService;
  let tokenValidateMock: jest.SpyInstance<Promise<boolean>, [string]>;
  let executionContext: ExecutionContext;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AzureActiveDirectoryGuard,
        AzureTokenValidationService,
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
      getClass: () => null,
      getHandler: () => null,
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
