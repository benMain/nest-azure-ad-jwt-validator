import { JwtKey } from './jwt-key';

describe('JwtKey', () => {
  it('should be defined', () => {
    expect(new JwtKey()).toBeDefined();
  });
});
