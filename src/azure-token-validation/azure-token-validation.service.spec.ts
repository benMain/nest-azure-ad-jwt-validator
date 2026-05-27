import { AxiosResponse } from 'axios';
import { JwtKey, JwtPayload } from '../models';
import { Observable, Observer } from 'rxjs';
import { Test, TestingModule } from '@nestjs/testing';

import { AzureTokenValidationService } from './azure-token-validation.service';
import { HttpService } from '@nestjs/axios';
import { NestAzureAdJwtValidatorModuleOptions } from '../module-config';
import { readFileSync } from 'fs';

interface AzureTokenValidationServicePrivate {
  verifyToken: () => JwtPayload;
}

describe('AzureTokenValidationService', () => {
  let service: AzureTokenValidationService;
  let servicePrivate: AzureTokenValidationServicePrivate;
  let httpService: HttpService;
  let getTokensMock: jest.SpyInstance<
    Observable<AxiosResponse<unknown>>,
    [string, any?]
  >;
  let verifyMock: jest.SpyInstance<JwtPayload, []>;
  // construct a fake JWT with a header that matches the mock discovery key `kid`
  const header = {
    alg: 'RS256',
    typ: 'JWT',
    kid: 'u4OfNFPHwEBosHjtrauObV84LnY',
  };
  const encodedHeader = Buffer.from(JSON.stringify(header))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  const testToken = `${encodedHeader}.payload.signature`;
  const testToken2 = `000a29f5-8e9d-4577-8050-194357a1d004`;
  const audienceToken = '53f9cdfd-f0c0-44b4-946d-fcdcbb755a82';
  const tenantToken = 'bf488ae9-30f3-4ab5-8b30-d9c1e3a9b51f';
  const mockUser: JwtPayload = {
    name: 'Benjamin Main',
    upn: ' bmain@lumeris.com',
    oid: '2ccce435-038d-4ec9-9cd7-85b2df5e39f8',
    roles: null,
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
  const mockClientCredential: JwtPayload & { appid?: string } = {
    aud: '00000002-0000-0000-c000-000000000000',
    iss: `https://sts.windows.net/${tenantToken}/`,
    iat: 1602201716,
    nbf: 1602201716,
    exp: 1602205616,
    aio: 'E2RgYPhhmKl24+2xzYsLRQ97+F4OAwA=',
    appid: audienceToken,
    oid: '8ae984ed-d502-41da-8594-ff74c84d8526',
    sub: '8ae984ed-d502-41da-8594-ff74c84d8526',
    tid: tenantToken,
    uti: '5LV9VLNjxEeeYn7ASmZkAA',
    ver: '1.0',
  } as any;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AzureTokenValidationService,
        {
          provide: HttpService,
          useValue: {
            get: () => null,
          },
        },
        {
          provide: NestAzureAdJwtValidatorModuleOptions,
          useValue: new NestAzureAdJwtValidatorModuleOptions({
            apps: [{ tenantId: tenantToken, audienceId: audienceToken }],
            enableDebugLogs: false,
          }),
        },
      ],
    }).compile();

    service = module.get<AzureTokenValidationService>(
      AzureTokenValidationService,
    );
    httpService = module.get<HttpService>(HttpService);
    servicePrivate = service as any as AzureTokenValidationServicePrivate;
    verifyMock = jest.spyOn(servicePrivate, 'verifyToken');
    getTokensMock = jest.spyOn(httpService, 'get');
    getTokensMock.mockReturnValue(
      new Observable(
        (observer: Observer<AxiosResponse<{ keys: JwtKey[] }>>) => {
          observer.next({
            data: getDiscoveryKeys(),
            status: 200,
            statusText: 'success',
            headers: {} as any,
            config: {} as any,
          });
          observer.complete();
        },
      ),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('isTokenValid()', () => {
    it('should validate a legit Azure token', async () => {
      verifyMock.mockReturnValue(mockUser as any);
      const response = await service.isTokenValid(testToken);
      const response2 = await service.isTokenValid(testToken2);
      expect(response[0]).toBeTruthy();
      expect(response2[0]).toBeFalsy();
      expect(getTokensMock).toHaveBeenCalledTimes(2);
      expect(verifyMock).toHaveBeenCalledTimes(1);
    });
    it('should work with the Client Credentials Flow', async () => {
      verifyMock.mockReturnValue(mockClientCredential);
      const response = await service.isTokenValid(testToken);
      expect(response[0]).toBeTruthy();
      expect(getTokensMock).toHaveBeenCalledTimes(1);
      expect(verifyMock).toHaveBeenCalledTimes(1);
    });
    it('should return false on expired Azure token and invalid service token', async () => {
      process.env.SERVICE_TOKEN = 'invalid-service-token';
      const [response, user, isServiceToken] =
        await service.isTokenValid(testToken);
      expect(response).toBeFalsy();
      expect(user).toBeFalsy();
      expect(isServiceToken).toBeTruthy();
      expect(getTokensMock).toHaveBeenCalledTimes(1);
      expect(verifyMock).toHaveBeenCalledTimes(1);
    });
    it('should return false on garbage Azure token and invalid service token', async () => {
      process.env.SERVICE_TOKEN = 'invalid-service-token';
      const [response, user, isServiceToken] =
        await service.isTokenValid('fdae');
      expect(response).toBeFalsy();
      expect(user).toBeFalsy();
      expect(isServiceToken).toBeTruthy();
      expect(getTokensMock).toHaveBeenCalledTimes(1);
      expect(verifyMock).toHaveBeenCalledTimes(0);
    });
    it('should return true on invalid Azure token, but valid service token', async () => {
      process.env.SERVICE_TOKEN = 'valid-service-token';
      const response = await service.isTokenValid('valid-service-token');
      expect(response).toBeTruthy();
      expect(getTokensMock).toHaveBeenCalledTimes(1);
      expect(verifyMock).toHaveBeenCalledTimes(0);
    });
  });
  describe('getAzureUserFromToken()', () => {
    it('should validate a legit token and return user', async () => {
      verifyMock.mockReturnValue(mockUser as any);
      const response = await service.getAzureUserFromToken(testToken);
      expect(response).toBeTruthy();
      expect(getTokensMock).toHaveBeenCalledTimes(1);
      expect(verifyMock).toHaveBeenCalledTimes(1);
      expect(response.email).toEqual(mockUser.upn);
      expect(response.fullName).toEqual(mockUser.name);
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
