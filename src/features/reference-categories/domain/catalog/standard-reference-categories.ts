import type { StandardReferenceCategory } from '../models/standard-reference-category';

export const STANDARD_REFERENCE_CATEGORIES: readonly StandardReferenceCategory[] = [
  // Core
  {
    id: 'species',
    name: 'Species',
    description: 'Sapient species, creatures, and other forms of life.',
    isCore: true,
  },
  {
    id: 'organization-types',
    name: 'Organization Types',
    description: 'Types of organizations, institutions, and structured groups.',
    isCore: true,
  },
  {
    id: 'titles',
    name: 'Titles',
    description: 'Noble, royal, religious, ceremonial, and other social titles.',
    isCore: true,
  },
  {
    id: 'ranks',
    name: 'Ranks',
    description: 'Hierarchical positions and grades within organizations and groups.',
    isCore: true,
  },
  {
    id: 'settlement-types',
    name: 'Settlement Types',
    description: 'Types of settlements and inhabited places.',
    isCore: true,
  },

  // Geography
  {
    id: 'climate-types',
    name: 'Climate Types',
    description: 'Long-term climate patterns and climatic regions.',
    isCore: false,
  },
  {
    id: 'terrain-types',
    name: 'Terrain Types',
    description: 'Physical landforms and environmental terrain features.',
    isCore: false,
  },
  {
    id: 'biome-types',
    name: 'Biome Types',
    description:
      'Ecological regions characterized by their climate, vegetation, and wildlife.',
    isCore: false,
  },
  {
    id: 'natural-phenomena',
    name: 'Natural Phenomena',
    description: 'Naturally occurring environmental events and processes.',
    isCore: false,
  },

  // Magic & Supernatural
  {
    id: 'magic-types',
    name: 'Magic Types',
    description: 'Schools, sources, and forms of magic.',
    isCore: false,
  },
  {
    id: 'magical-abilities',
    name: 'Magical Abilities',
    description: 'Supernatural powers and abilities granted by magic.',
    isCore: false,
  },
  {
    id: 'magical-artifacts',
    name: 'Magical Artifacts',
    description: 'Objects imbued with magical properties or supernatural power.',
    isCore: false,
  },
  {
    id: 'supernatural-entities',
    name: 'Supernatural Entities',
    description: 'Beings and entities that exist beyond ordinary natural life.',
    isCore: false,
  },
  {
    id: 'deities',
    name: 'Deities',
    description: 'Gods, goddesses, and other divine beings.',
    isCore: false,
  },
  {
    id: 'curses',
    name: 'Curses',
    description: 'Supernatural afflictions, bindings, and harmful enchantments.',
    isCore: false,
  },
  {
    id: 'religions',
    name: 'Religions',
    description: 'Religious traditions, belief systems, and forms of worship.',
    isCore: false,
  },

  // Society & Culture
  {
    id: 'social-classes',
    name: 'Social Classes',
    description:
      'Social strata and groups defined by status, wealth, occupation, or rights.',
    isCore: false,
  },
  {
    id: 'government-types',
    name: 'Government Types',
    description: 'Forms of government and structures of political authority.',
    isCore: false,
  },
  {
    id: 'political-systems',
    name: 'Political Systems',
    description: 'Political ideologies and systems organizing power and society.',
    isCore: false,
  },
  {
    id: 'professions',
    name: 'Professions',
    description: 'Occupations, trades, and specialized lines of work.',
    isCore: false,
  },
  {
    id: 'laws-and-customs',
    name: 'Laws & Customs',
    description: 'Legal systems, social norms, traditions, and cultural practices.',
    isCore: false,
  },
  {
    id: 'languages',
    name: 'Languages',
    description: 'Languages and other systems of communication.',
    isCore: false,
  },

  // Science & Technology
  {
    id: 'technology-types',
    name: 'Technology Types',
    description: 'Technological fields, disciplines, and areas of application.',
    isCore: false,
  },
  {
    id: 'artificial-intelligence-types',
    name: 'Artificial Intelligence Types',
    description: 'Types and forms of artificial intelligence and synthetic minds.',
    isCore: false,
  },
  {
    id: 'cybernetic-enhancements',
    name: 'Cybernetic Enhancements',
    description:
      'Mechanical, electronic, and cybernetic enhancements to living organisms.',
    isCore: false,
  },
  {
    id: 'energy-sources',
    name: 'Energy Sources',
    description: 'Natural, artificial, and supernatural sources of usable energy.',
    isCore: false,
  },
  {
    id: 'transportation-types',
    name: 'Transportation Types',
    description: 'Modes and means of transportation across different environments.',
    isCore: false,
  },

  // Military & Conflicts
  {
    id: 'military-branches',
    name: 'Military Branches',
    description: 'Branches and specialized divisions of armed forces.',
    isCore: false,
  },
  {
    id: 'weapon-types',
    name: 'Weapon Types',
    description: 'Classes and types of weapons.',
    isCore: false,
  },
  {
    id: 'combat-styles',
    name: 'Combat Styles',
    description: 'Fighting techniques, martial disciplines, and combat tactics.',
    isCore: false,
  },
  {
    id: 'faction-types',
    name: 'Faction Types',
    description:
      'Types of factions and groups involved in political, ideological, or military conflicts.',
    isCore: false,
  },

  // Specialized
  {
    id: 'planet-types',
    name: 'Planet Types',
    description: 'Types of planets and other planetary bodies.',
    isCore: false,
  },
  {
    id: 'spacecraft-types',
    name: 'Spacecraft Types',
    description: 'Types of spacecraft classified by design, purpose, or role.',
    isCore: false,
  },
  {
    id: 'resource-types',
    name: 'Resource Types',
    description: 'Natural, material, biological, and other valuable resources.',
    isCore: false,
  },
  {
    id: 'survival-skills',
    name: 'Survival Skills',
    description: 'Skills and techniques required to survive in challenging environments.',
    isCore: false,
  },
  {
    id: 'paranormal-phenomena',
    name: 'Paranormal Phenomena',
    description: 'Unexplained or supernatural events and occurrences.',
    isCore: false,
  },
];
