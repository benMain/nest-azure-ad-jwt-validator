import { JwtPayload } from './jwt-payload';

export class AzureAdUser {
  readonly id: string;
  readonly email: string;
  readonly fullName: string;
  readonly roles: string[];
  readonly audience: string;
  readonly tenant: string;

  constructor(jwt?: JwtPayload) {
    if (!jwt) {
      jwt = {} as JwtPayload;
    }

    this.email = jwt.upn;
    this.fullName = jwt.name;
    this.id = jwt.oid;
    this.roles = jwt.roles;
    this.audience = jwt.aud;
    this.tenant = jwt.tid;
  }
}
