import type { BaseUniverseEntity } from './base-universe-entity';
import type { CharacterProperties } from './character-properties';
import type { EventProperties } from './event-properties';
import type { ItemProperties } from './item-properties';
import type { LocationProperties } from './location-properties';
import type { OrganizationProperties } from './organization-properties';

export type UniverseEntity =
  | (BaseUniverseEntity & {
      type: 'character';
      properties: CharacterProperties;
    })
  | (BaseUniverseEntity & {
      type: 'location';
      properties: LocationProperties;
    })
  | (BaseUniverseEntity & {
      type: 'event';
      properties: EventProperties;
    })
  | (BaseUniverseEntity & {
      type: 'item';
      properties: ItemProperties;
    })
  | (BaseUniverseEntity & {
      type: 'organization';
      properties: OrganizationProperties;
    });
