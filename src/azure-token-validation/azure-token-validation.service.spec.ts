import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { JwtKey, JwtPayload } from '../models';
import { Observable, Observer } from 'rxjs';
import { Test, TestingModule } from '@nestjs/testing';

import { AzureTokenValidationService } from './azure-token-validation.service';
import { HttpService } from '@nestjs/common';
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
    [string, AxiosRequestConfig?]
  >;
  let verifyMock: jest.SpyInstance<JwtPayload, []>;
  // tslint:disable-next-line: max-line-length
  const testToken = `eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6InU0T2ZORlBId0VCb3NIanRyYXVPYlY4NExuWSIsImtpZCI6InU0T2ZORlBId0VCb3NIanRyYXVPYlY4NExuWSJ9.eyJhdWQiOiIzMjNiYWUwNC1hMjY3LTQxMWEtYTJhOS05ZDYzYTcyNWVmMmEiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC8zYmRlYzY1Yi0zZjZkLTQzYmItYTE5NC1hZDkyYzA5MDkyODcvIiwiaWF0IjoxNTYzODEyNjQzLCJuYmYiOjE1NjM4MTI2NDMsImV4cCI6MTU2MzgxNjU0MywiYWlvIjoiQVZRQXEvOE1BQUFBWCtCZmk0aTBoUHh2NGpESnBvL2NYR25HKzIvUGhIbEpsQTdFdXUzN3J5eHdESFlqc0Y4UDRvb1U2Y0d6OGQ4QUt2ZlB2WU9sWlV2MjdDdXo5L0R5UGx3Z3BidVg3Q0lZWDdkOExqZnJzVlk9IiwiYW1yIjpbInB3ZCIsIm1mYSJdLCJmYW1pbHlfbmFtZSI6Ik1haW4iLCJnaXZlbl9uYW1lIjoiQmVuamFtaW4iLCJpcGFkZHIiOiIxMi4xNzQuMTIzLjEyNSIsIm5hbWUiOiJCZW4gTWFpbiIsIm5vbmNlIjoiNzY3NWUzYTUtZjgxNi00NjM2LWI5Y2YtMjQ5OGVkNTA4NGRhIiwib2lkIjoiZDlhZjQ5MWMtYTdlNi00NmNlLWJkMDUtNGQ3YTNhZjdhODY4Iiwib25wcmVtX3NpZCI6IlMtMS01LTIxLTE4OTg3MjEzMjgtMjQ2OTgxNjc0NC0yNTI4MzA1Mzk3LTc1NTYiLCJzdWIiOiJKaVhPeWJOMm9nWHU0bFhaQkJoWWM4d2Jyb2Q5RllzT2ZFc0h6ZWd3WU0wIiwidGlkIjoiM2JkZWM2NWItM2Y2ZC00M2JiLWExOTQtYWQ5MmMwOTA5Mjg3IiwidW5pcXVlX25hbWUiOiJibWFpbkBsdW1lcmlzLmNvbSIsInVwbiI6ImJtYWluQGx1bWVyaXMuY29tIiwidXRpIjoidVltVnd2dmpfRWVTRE95M3RTNVJBQSIsInZlciI6IjEuMCJ9.L0cpS5NizJbPeNtUqHiO7fAWw_4OxFA0wkpJttvw5kPyetqmw-oGVFClFdfhopXJv_W4EKbD0yYgj1BvxyfkvfbNZcpwcGjP7ynmtmJproZAcwL5RRvx-A8J-bJyUq6lugRKWvGRJyTbPkTE_BvZVA3FkM942fmt46vzpIWg1vIYwRApZ5l4HhIJykQMKhyjpPuCoSGAlYCZyupeE2vRB4nIxxcarVLBhv2cBHBSClE0zMA9Tjc1_LT5LMCSmoCrVo3MK4oRPoNmpfoak44v4nDA0xTUwbIsOYxQIl01e89zQzj3zSENwxdtCKzd6STh2zZjgwFIQXYqbEuAU3cOqQ`;
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
    servicePrivate = (service as any) as AzureTokenValidationServicePrivate;
    verifyMock = jest.spyOn(servicePrivate, 'verifyToken');
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
      const [response, user, isServiceToken] = await service.isTokenValid(
        testToken,
      );
      expect(response).toBeFalsy();
      expect(getTokensMock).toHaveBeenCalledTimes(1);
      expect(verifyMock).toHaveBeenCalledTimes(1);
    });
    it('should return false on garbage Azure token and invalid service token', async () => {
      process.env.SERVICE_TOKEN = 'invalid-service-token';
      const [response, user, isServiceToken] = await service.isTokenValid(
        'fdae',
      );
      expect(response).toBeFalsy();
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
