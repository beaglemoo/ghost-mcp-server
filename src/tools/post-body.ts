// Pure request-body helpers for posts and pages. Kept free of any Ghost API
// client import so they can be used (and checked) without credentials.

const GHOST_ID_RE = /^[0-9a-f]{24}$/i;
export const CUSTOM_EXCERPT_MAX = 300;

export const coverFieldsSchema = {
  feature_image: {
    type: 'string',
    description: 'Cover image URL (e.g. the ghost_url returned by upload_image_from_url)'
  },
  feature_image_alt: {
    type: 'string',
    description: 'Alt text for the cover image'
  },
  feature_image_caption: {
    type: 'string',
    description: 'Caption for the cover image (HTML allowed)'
  },
  custom_excerpt: {
    type: 'string',
    description: `Custom excerpt (max ${CUSTOM_EXCERPT_MAX} characters)`,
    maxLength: CUSTOM_EXCERPT_MAX
  },
  meta_title: {
    type: 'string',
    description: 'SEO meta title'
  },
  meta_description: {
    type: 'string',
    description: 'SEO meta description'
  },
  og_image: {
    type: 'string',
    description: 'Open Graph image URL'
  }
};

export const tagsDescription =
  'Array of tags. Each entry is either a tag ID (24-character hex) or a tag name; unknown names are created by Ghost';

const COVER_STRING_KEYS = [
  'feature_image',
  'feature_image_alt',
  'feature_image_caption',
  'custom_excerpt',
  'meta_title',
  'meta_description',
  'og_image'
] as const;

export type CoverFields = Partial<Record<(typeof COVER_STRING_KEYS)[number], string>>;

// Picks the cover/excerpt/SEO fields out of raw tool arguments. Only keys that
// were supplied as strings are returned, so omitted fields are never sent.
export const parseCoverFields = (args: Record<string, unknown>): CoverFields => {
  const out: CoverFields = {};
  for (const key of COVER_STRING_KEYS) {
    const value = args[key];
    if (typeof value === 'string') {
      out[key] = value;
    }
  }
  if (out.custom_excerpt !== undefined && out.custom_excerpt.length > CUSTOM_EXCERPT_MAX) {
    throw new Error(
      `custom_excerpt is ${out.custom_excerpt.length} characters; the maximum is ${CUSTOM_EXCERPT_MAX}`
    );
  }
  return out;
};

// A value that is not a 24-char hex id is treated as a tag name.
export const normalizeTags = (tags: string[]): Array<{ id: string } | { name: string }> =>
  tags.map((t) => (GHOST_ID_RE.test(t) ? { id: t } : { name: t }));

export interface GhostRequest {
  data: Record<string, unknown>;
  queryParams: Record<string, string>;
}

const buildBody = (fields: Record<string, unknown>): Record<string, unknown> => {
  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    data[key] = key === 'tags' && Array.isArray(value) ? normalizeTags(value as string[]) : value;
  }
  return data;
};

const buildQuery = (data: Record<string, unknown>): Record<string, string> =>
  data.html ? { source: 'html' } : {};

export const buildCreateRequest = (fields: Record<string, unknown>): GhostRequest => {
  const data = buildBody(fields);
  return { data, queryParams: buildQuery(data) };
};

// html/lexical are only present in the body when the caller supplied them, so a
// metadata-only update never touches the existing content.
export const buildUpdateRequest = (
  id: string,
  fields: Record<string, unknown>,
  updatedAt: string
): GhostRequest => {
  const data = { id, ...buildBody(fields), updated_at: updatedAt };
  return { data, queryParams: buildQuery(data) };
};
