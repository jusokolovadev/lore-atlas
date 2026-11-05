import type { ImageReference } from 'src/shared/types/image-reference';
import type { UniverseEntity } from '../../domain/models/universe-entity';

type BaseUniverseEntityChanges = {
  name?: string;
  description?: string | null;
  image?: ImageReference | null;
};

export type UniverseEntityChanges =
  | (BaseUniverseEntityChanges & {
      type: 'character';
      properties?: Extract<UniverseEntity, { type: 'character' }>['properties'];
    })
  | (BaseUniverseEntityChanges & {
      type: 'location';
      properties?: Extract<UniverseEntity, { type: 'location' }>['properties'];
    })
  | (BaseUniverseEntityChanges & {
      type: 'event';
      properties?: Extract<UniverseEntity, { type: 'event' }>['properties'];
    })
  | (BaseUniverseEntityChanges & {
      type: 'item';
      properties?: Extract<UniverseEntity, { type: 'item' }>['properties'];
    })
  | (BaseUniverseEntityChanges & {
      type: 'organization';
      properties?: Extract<UniverseEntity, { type: 'organization' }>['properties'];
    });
