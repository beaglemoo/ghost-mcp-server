// Prints the request the update_post / create_post handlers would send, without
// contacting Ghost. Needs no credentials. Run `npm run build` first.
//
//   node scripts/dry-run-update.mjs
import { parseCoverFields, buildUpdateRequest, buildCreateRequest } from '../build/tools/post-body.js';

const show = (label, req) => {
  console.log(`--- ${label}`);
  console.log('query:', JSON.stringify(req.queryParams));
  console.log('body: ', JSON.stringify({ posts: [req.data] }, null, 2));
  console.log('has html key:   ', 'html' in req.data);
  console.log('has lexical key:', 'lexical' in req.data);
};

// Mirrors the argument handling in src/index.ts for update_post.
const updateArgs = {
  id: '0123456789abcdef01234567',
  feature_image: 'https://blog.example.com/content/images/2026/11/cover.png',
  custom_excerpt: 'A short excerpt for the post.',
};
const { id, ...rest } = updateArgs;
show(
  'update_post: only feature_image + custom_excerpt',
  buildUpdateRequest(id, { ...parseCoverFields(updateArgs) }, '2026-11-07T10:00:00.000Z')
);

const createArgs = {
  title: 'Hello',
  html: '<p>Body</p>',
  tags: ['homelab', '5f1a2b3c4d5e6f7a8b9c0d1e'],
  ...rest,
  feature_image_alt: 'Pixel art capybara',
};
show(
  'create_post: html + tags (name and id) + cover',
  buildCreateRequest({
    title: createArgs.title,
    html: createArgs.html,
    tags: createArgs.tags,
    ...parseCoverFields(createArgs),
  })
);
