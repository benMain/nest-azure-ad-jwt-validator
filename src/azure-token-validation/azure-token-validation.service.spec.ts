import { Test, TestingModule } from '@nestjs/testing';
import { AzureTokenValidationService } from './azure-token-validation.service';
import { HttpService } from '@nestjs/common';
import { JwtPayload, JwtKey } from '../models';
import { Observable, Observer } from 'rxjs';
import { AxiosResponse, AxiosRequestConfig } from 'axios';
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
  const mockUser = { name: 'Benjamin Main', upn: ' bmain@lumeris.com' };
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
    it('should validate a legit token', async () => {
      verifyMock.mockReturnValue(mockUser as any);
      const response = await service.isTokenValid(testToken);
      expect(response).toBeTruthy();
      expect(getTokensMock).toHaveBeenCalledTimes(1);
      expect(verifyMock).toHaveBeenCalledTimes(1);
    });
    it('should return false on expired token', async () => {
      const response = await service.isTokenValid(testToken);
      expect(response).toBeFalsy();
      expect(getTokensMock).toHaveBeenCalledTimes(1);
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
      expect(response.name).toEqual(mockUser.name);
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
