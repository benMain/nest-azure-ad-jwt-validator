import { APP_GUARD, Reflector } from '@nestjs/core';
import { AUDIENCE_TOKEN, TENANT_TOKEN } from '../constants';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import {
  Controller,
  ExecutionContext,
  Get,
  HttpService,
  Injectable,
  Module,
  SetMetadata,
} from '@nestjs/common';
import { JwtKey, JwtPayload } from '../models';
import { Observable, Observer } from 'rxjs';
import { Test, TestingModule } from '@nestjs/testing';

import { AzureActiveDirectoryGuard } from './azure-active-directory.guard';
import { AzureTokenValidationService } from '../azure-token-validation';
import { NestAzureAdJwtValidatorModule } from '../nest-azure-ad-jwt-validator.module';
import { readFileSync } from 'fs';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

interface AzureTokenValidationServicePrivate {
  verifyToken: () => JwtPayload;
}

describe('AzureActiveDirectoryGuard', () => {
  let guard: AzureActiveDirectoryGuard;
  let service: AzureTokenValidationService;
  let httpService: HttpService;
  let reflector: Reflector;

  let tokenValidateMock: jest.SpyInstance<Promise<boolean>, [string]>;
  let getAzureUserFromTokenMock: jest.SpyInstance;
  let getReflectorSpy: jest.SpyInstance;
  let getTokensMock: jest.SpyInstance;
  let executionContext: ExecutionContext;

  const audienceToken = 'ff45a46b-5dc8-4f5e-ae2d-f92f978deade';
  const tenantToken = '1f698e30-434c-4488-a068-fb417df97dc4';
  const mockUser: JwtPayload = {
    name: 'Benjamin Main',
    upn: ' bmain@lumeris.com',
    oid: '2ccce435-038d-4ec9-9cd7-85b2df5e39f8',
    roles: ['admin'],
    aud: audienceToken,
    tid: tenantToken,
    iss: `https://sts.windows.net/${tenantToken}/`,
    iat: 1576190172,
    nbf: 1576190172,
    exp: 1576194072,
    aio: 'fake',
    amr: [],
    family_name: 'Main',
    given_name: 'Benjamin',
    ipaddr: '10.10.10.10',
    nonce: '0474e873-cf17-48e5-bf7b-b7763482b78d',
    onprem_sid: '0474e873-cf17-48e5-bf7b-b7763482b78d',
    sub: '0474e873-cf17-48e5-bf7b-b7763482b78d',
    unique_name: 'bmain@lumeris.com',
    uti: '0474e873-cf17-48e5-bf7b-b7763482b78d',
    ver: '1.0',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AzureActiveDirectoryGuard,
        AzureTokenValidationService,
        {
          provide: Reflector,
          useValue: {
            get: () => null,
          },
        },
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
    reflector = module.get<Reflector>(Reflector);
    tokenValidateMock = jest.spyOn(service, 'isTokenValid');
    getAzureUserFromTokenMock = jest.spyOn(service, 'getAzureUserFromToken');
    getReflectorSpy = jest.spyOn(reflector, 'get');
    const incomingRequest: any = {
      headers: {
        authtoken: '12345A',
      },
    };
    httpService = module.get<HttpService>(HttpService);
    getTokensMock = jest.spyOn(httpService, 'get');
    getTokensMock.mockReturnValue(
      new Observable(
        (observer: Observer<AxiosResponse<{ keys: JwtKey[] }>>) => {
          observer.next({
            data: getDiscoveryKeys(),
            status: 200,
            statusText: 'success',
            headers: null,
            config: null,
          });
          observer.complete();
        },
      ),
    );
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
    it('should activate for valid token no roles', async () => {
      tokenValidateMock.mockReturnValue(Promise.resolve(true));
      const canActivate = await guard.canActivate(executionContext);
      expect(canActivate).toEqual(true);
      expect(tokenValidateMock).toHaveBeenCalledTimes(1);
      expect(tokenValidateMock).toHaveBeenCalledWith('12345A');
    });
    it('should activate for valid token with roles', async () => {
      getAzureUserFromTokenMock.mockReturnValue(mockUser as any);
      tokenValidateMock.mockReturnValue(Promise.resolve(true));
      getReflectorSpy.mockReturnValue(['admin']);
      const canActivate = await guard.canActivate(executionContext);
      expect(canActivate).toEqual(true);
      expect(tokenValidateMock).toHaveBeenCalledTimes(1);
      expect(tokenValidateMock).toHaveBeenCalledWith('12345A');
    });
    it('should activate for valid token with invalid role', async () => {
      getAzureUserFromTokenMock.mockReturnValue(mockUser as any);
      tokenValidateMock.mockReturnValue(Promise.resolve(true));
      getReflectorSpy.mockReturnValue(['fakeNotKnownRole']);
      const canActivate = await guard.canActivate(executionContext);
      expect(canActivate).toEqual(false);
      expect(tokenValidateMock).toHaveBeenCalledTimes(1);
      expect(tokenValidateMock).toHaveBeenCalledWith('12345A');
    });
  });
});

function getDiscoveryKeys(): { keys: JwtKey[] } {
  const buffer = readFileSync(
    './src/azure-token-validation/mock-discovery-keys-response.json',
  );
  const data = buffer.toString('utf8');
  return JSON.parse(data);
}
