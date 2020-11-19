import { JwtPayload } from './jwt-payload';

export class AzureAdUser {
  readonly id: string;
  readonly email: string;
  readonly fullName: string;
  readonly roles: string[];
  readonly audience: string;
  readonly tenant: string;
  readonly subject: string;
  readonly appId?: string;

  constructor(jwt?: JwtPayload & { appid?: string }) {
    if (!jwt) {
      jwt = {} as JwtPayload;
    }

    this.email = jwt.upn ?? `ClientCredentialsToken|${jwt.appid ?? ''}`;
    this.fullName = jwt.name ?? `ClientCredentialsToken|${jwt.appid ?? ''}`;
    this.id = jwt.oid;
    this.roles = jwt.roles;
    this.audience = jwt.aud;
    this.tenant = jwt.tid;
    this.subject = jwt.sub;
    this.appId = jwt.appid;
  }
}
