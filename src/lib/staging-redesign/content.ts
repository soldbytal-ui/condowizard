// Content model for the staging redesign. Keeping copy in one place so it can be
// reviewed by the operator without touching layout or shared systems.
//
// Some fields are intentionally cautious because the repository does not currently
// document the business term. Unresolved terms are called out in the completion
// notes rather than invented here.

export interface StagingService {
  title: string;
  description: string;
}

export const SERVICE_OVERVIEW: StagingService[] = [
  {
    title: 'Property assessment',
    description: 'A walkthrough of the property to identify what to keep, edit, refresh or replace before the listing launches.',
  },
  {
    title: 'Design direction',
    description: 'A written plan for each staged room — palette, furniture, art and accessory choices tailored to the target buyer.',
  },
  {
    title: 'Occupied-home styling',
    description: 'Working around the seller\'s existing furniture, editing what stays and adding accent pieces where they help.',
  },
  {
    title: 'Vacant-property staging',
    description: 'A full furniture and accessory install so buyers see the space furnished at market-appropriate scale.',
  },
  {
    title: 'Furniture and accessory installation',
    description: 'Delivery, placement and styling by the staging team on a scheduled install day.',
  },
  {
    title: 'Photography preparation',
    description: 'Coordinating with the listing photographer so the property is photo-ready when the shoot happens.',
  },
  {
    title: 'Removal after sale or agreed rental period',
    description: 'Furniture and accessory pickup at the end of the listing engagement or the agreed rental term.',
  },
];

// Occupied vs vacant comparison. "typical" is used where scope depends on the
// individual property; specifics are always confirmed on the consultation.
export interface CompareRow {
  label: string;
  occupied: 'included' | 'when-appropriate' | 'not-typical';
  vacant: 'included' | 'when-appropriate' | 'not-typical';
  note?: string;
}

export const COMPARE_ROWS: CompareRow[] = [
  { label: 'Initial consultation', occupied: 'included', vacant: 'included' },
  { label: 'Written design plan', occupied: 'included', vacant: 'included' },
  { label: 'Editing existing furniture', occupied: 'included', vacant: 'not-typical', note: 'Vacant properties have no existing pieces to edit.' },
  { label: 'Furniture rental', occupied: 'when-appropriate', vacant: 'included', note: 'Occupied homes may only need accent additions.' },
  { label: 'Art and accessories', occupied: 'when-appropriate', vacant: 'included' },
  { label: 'Delivery and install', occupied: 'when-appropriate', vacant: 'included' },
  { label: 'Photography preparation', occupied: 'included', vacant: 'included' },
  { label: 'Removal at end of term', occupied: 'when-appropriate', vacant: 'included' },
];

export const COMPARE_LEGEND: Record<CompareRow['occupied'], { label: string; className: string }> = {
  'included': { label: 'Included', className: 'bg-text-primary text-white' },
  'when-appropriate': { label: 'When appropriate', className: 'bg-text-primary/10 text-text-primary' },
  'not-typical': { label: 'Not typical', className: 'bg-transparent text-text-muted border border-border' },
};

// Listing preparation services split into three categories.
export interface PrepGroup {
  label: string;
  tone: 'included' | 'coordinated' | 'optional';
  items: string[];
  description: string;
}

export const PREP_GROUPS: PrepGroup[] = [
  {
    label: 'Included with staging',
    tone: 'included',
    description: 'Delivered by the CondoWizard staging team as part of the listing preparation scope.',
    items: [
      'Property assessment',
      'Written design plan',
      'Furniture and accessory installation',
      'Photography preparation',
      'Removal at end of the agreed term',
    ],
  },
  {
    label: 'Coordinated on your behalf',
    tone: 'coordinated',
    description: 'Arranged by CondoWizard through trusted trades. Scope, pricing and timing are confirmed with you before work begins.',
    items: [
      'Decluttering plan',
      'Cleaning',
      'Painting',
      'Minor repairs',
      'Listing photography and floor plans',
    ],
  },
  {
    label: 'Optional additional',
    tone: 'optional',
    description: 'Available on request. Priced separately based on scope and confirmed in writing before work starts.',
    items: [
      'Fixture changes',
      'Accent wall installations',
      'Extended furniture rental beyond the initial term',
      'Additional inventory for larger properties',
    ],
  },
];

// Process — deliberately uses approximate timing language.
export interface ProcessStep {
  n: string;
  title: string;
  desc: string;
  timing: string;
}

export const PROCESS_STEPS: ProcessStep[] = [
  {
    n: '01',
    title: 'Property assessment',
    desc: 'Walkthrough of the property to review layout, existing furniture, condition and the listing timeline.',
    timing: 'Typically 45–60 minutes on-site',
  },
  {
    n: '02',
    title: 'Preparation plan',
    desc: 'Written scope covering staging approach, coordinated services, timeline and any items to confirm before install day.',
    timing: 'Delivered within a few business days',
  },
  {
    n: '03',
    title: 'Installation and styling',
    desc: 'Furniture, art and accessories are delivered and styled on a scheduled install day.',
    timing: 'Typically completed in one day',
  },
  {
    n: '04',
    title: 'Photography and listing launch',
    desc: 'Photography and marketing materials are produced, then the listing goes live on MLS.',
    timing: 'Photos usually within the same week as install',
  },
  {
    n: '05',
    title: 'Removal after sale or agreed term',
    desc: 'Furniture and accessories are removed once the property has sold or at the end of the agreed rental period.',
    timing: 'Scheduled around the closing timeline',
  },
];

export interface StagingFAQ {
  q: string;
  a: string;
}

export const STAGING_FAQS: StagingFAQ[] = [
  {
    q: 'What is included in a staging consultation?',
    a: 'A walkthrough of the property, a written design plan for the staged rooms, and a scope covering furniture, coordinated services and timing. Specific inclusions are confirmed on the property and in the listing agreement.',
  },
  {
    q: 'How does staging differ for occupied and vacant homes?',
    a: 'Occupied homes are usually styled around the seller\'s existing pieces, with accent additions where they help. Vacant properties are staged with a full furniture and accessory package so buyers can read the scale of each room.',
  },
  {
    q: 'How long does the staging process typically take?',
    a: 'A typical timeline is one to two weeks from the consultation to a photo-ready property. Exact timing depends on the size of the property, the scope of preparation work and the target listing date, and is confirmed on the consultation.',
  },
  {
    q: 'Do I have to move out during staging?',
    a: 'No. Occupied staging is designed to work around the seller. Rooms are staged and refreshed in place, and the seller only needs to leave the property vacant during photography and showings.',
  },
  {
    q: 'How long does the furniture rental last?',
    a: 'Rental terms are set on the listing agreement based on the expected marketing period. Extensions beyond the initial term are available and are priced separately before the extension begins.',
  },
  {
    q: 'What if the property does not sell during the initial rental term?',
    a: 'If the property has not sold when the initial term ends, the rental can be extended or the furniture removed. Extension pricing and next steps are discussed before the term expires so there are no surprise charges.',
  },
  {
    q: 'What areas of Toronto do you serve?',
    a: 'CondoWizard is Toronto-focused, with service primarily across the City of Toronto. Neighbouring GTA properties are considered on a case-by-case basis and confirmed at the consultation.',
  },
  {
    q: 'Do you handle painting, cleaning and minor repairs?',
    a: 'These are typically coordinated through trusted trades rather than delivered directly. Scope and pricing are confirmed in writing before any coordinated work begins.',
  },
  {
    q: 'Is staging available without listing with CondoWizard?',
    a: 'The staging service is designed to sit inside the CondoWizard listing engagement so pricing, timing and marketing align. Standalone staging inquiries are reviewed individually — indicate this on the consultation form.',
  },
  {
    q: 'How do I book a consultation?',
    a: 'Complete the seller consultation form on this page, or call Tal directly at 647-890-4082. The consultation is used to review the property, the timeline and the scope before any work is scheduled.',
  },
];

export const DISCLOSURE = `Staging scope depends on the property, listing agreement, size, condition, required inventory and expected marketing period. Any exclusions or additional costs are confirmed before work begins.`;

export const HERO_H1 = 'Professional Home Staging in Toronto';
export const HERO_SUPPORT = 'Professional staging, design direction and listing preparation coordinated as part of your Toronto property sale.';

// About / team block. Keeping the staging partner relationship deliberately
// non-specific because it is not documented in the repository. See completion
// notes for the unresolved item.
export const TEAM_COPY = {
  agent: {
    name: 'Tal Shelef',
    title: 'Sales Representative',
    brokerage: 'Rare Real Estate Inc., Brokerage',
    address: '1701 Avenue Rd, Toronto ON M5M 3Y3',
    phone: '647-890-4082',
    email: 'Contact@condowizard.ca',
    bio: 'Tal leads the CondoWizard listing experience, coordinating pricing, presentation and marketing for Toronto sellers. Staging is arranged as part of the listing preparation process, not as a standalone product.',
  },
  designTeam: 'The staging and design work is delivered by the CondoWizard design team. Any third-party staging providers involved on a specific listing are named in the listing agreement.',
};

// About the visible SEO copy.
export const SEO_INTRO = `CondoWizard coordinates professional home staging for Toronto sellers as part of the listing preparation process. Every engagement includes a property assessment, a written design plan, and installation of furniture and accessories where the property benefits from them. Occupied homes are styled around the seller's existing pieces; vacant properties are staged with a full furniture package so buyers can read the scale of each room. Related listing preparation services — cleaning, painting, minor repairs, professional photography and floor plans — are coordinated on the seller's behalf, with scope and pricing confirmed in writing before work begins. The service is designed to sit inside a CondoWizard listing engagement so pricing, timing and marketing align.`;
