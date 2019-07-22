import { JwtPayload } from './jwt-payload';

export class AzureAdUser {
  email: string;
  name: string;

  constructor(jwt?: JwtPayload) {
    if (!jwt) {
      jwt = {} as JwtPayload;
    }

    this.email = jwt.upn;
    this.name = jwt.name;
  }
}
