import { areRelationshipParticipantsValid } from './are-relationship-participants-valid';

describe('areRelationshipParticipantsValid', () => {
  it('returns true for two different participant IDs', () => {
    expect(areRelationshipParticipantsValid('entity-1', 'entity-2')).toBe(true);
  });

  it('returns false when participant IDs are identical', () => {
    expect(areRelationshipParticipantsValid('entity-1', 'entity-1')).toBe(false);
  });

  it('returns false when source ID is empty', () => {
    expect(areRelationshipParticipantsValid('', 'entity-2')).toBe(false);
  });

  it('returns false when target ID is empty', () => {
    expect(areRelationshipParticipantsValid('entity-1', '')).toBe(false);
  });

  it('returns false when participant IDs contain only whitespace', () => {
    expect(areRelationshipParticipantsValid('   ', 'entity-2')).toBe(false);
  });
});
