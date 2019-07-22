import { AzureAdUser } from './azure-ad-user';

describe('AzureAdUser', () => {
  it('should be defined', () => {
    expect(new AzureAdUser()).toBeDefined();
  });
});
