export class JwtPayload {
  aud: string;
  iss: string;
  iat: number;
  nbf: number;
  exp: number;
  aio: string;
  amr: string[];
  // tslint:disable-next-line: variable-name
  family_name: string;
  // tslint:disable-next-line: variable-name
  given_name: string;
  ipaddr: string;
  name: string;
  nonce: string;
  oid: string;
  roles?: string[];
  // tslint:disable-next-line: variable-name
  onprem_sid: string;
  sub: string;
  tid: string;
  // tslint:disable-next-line: variable-name
  unique_name: string;
  upn: string;
  uti: string;
  ver: string;
}
