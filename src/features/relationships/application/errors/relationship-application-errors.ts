export class RelationshipConcurrencyError extends Error {
  constructor(message = 'Relationship not found, deleted, or revision conflict.') {
    super(message);
    this.name = 'RelationshipConcurrencyError';
  }
}

export class RelationshipParticipantsUnavailableError extends Error {
  constructor(message = 'Relationship participants not found or deleted.') {
    super(message);
    this.name = 'RelationshipParticipantsUnavailableError';
  }
}

export class RelationshipAlreadyExistsError extends Error {
  constructor(message = 'Relationship already exists.') {
    super(message);
    this.name = 'RelationshipAlreadyExistsError';
  }
}
