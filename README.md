# Ghost MCP Server

A Model Context Protocol (MCP) server that integrates with the Ghost Admin API. This server enables programmatic access to Ghost CMS features including post management, page management, member management, and more.

## Features

- Post Management (create, read, update, delete, search)
- Page Management (create, read, update, delete)
- Tag Management
- Author Management
- Member Management (create, read, update, delete, search)
- Image Upload (Base64 and URL-based)

## Prerequisites

- Node.js (v18 or higher recommended)
- Ghost CMS instance
- Ghost Admin API key

## Installation

Install the package using npm:

```bash
npm install @densh/ghost-mcp-server
```

## Configuration

1. Create a new custom integration in your Ghost Admin dashboard under Settings > Integrations.

2. Set the following environment variables:

```bash
# macOS/Linux
export GHOST_API_URL="https://your-ghost-blog.com"
export GHOST_ADMIN_API_KEY="your_admin_api_key"

# Windows (PowerShell)
$env:GHOST_API_URL="https://your-ghost-blog.com"
$env:GHOST_ADMIN_API_KEY="your_admin_api_key"
```

Alternatively, you can create a `.env` file:

```env
GHOST_API_URL=https://your-ghost-blog.com
GHOST_ADMIN_API_KEY=your_admin_api_key
```

## Usage

After installation, start the server with:

```bash
npx @densh/ghost-mcp-server
```

## Available Tools

### get_posts
Retrieves a list of blog posts.

Input:
```json
{
  "limit": "number", // Optional: Number of posts to retrieve (1-100, default: 10)
  "page": "number"   // Optional: Page number (default: 1)
}
```

### get_post
Retrieves a specific post by ID.

Input:
```json
{
  "id": "string" // Required: Post ID
}
```

### search_posts
Searches for posts.

Input:
```json
{
  "query": "string", // Required: Search query
  "limit": "number"  // Optional: Number of posts to retrieve (1-100, default: 10)
}
```

### create_post
Creates a new post.

Input:
```json
{
  "title": "string",     // Required: Post title
  "html": "string",      // Optional: HTML content
  "lexical": "string",   // Optional: Lexical content
  "status": "string",    // Optional: Post status (published/draft/scheduled)
  "visibility": "string", // Optional: Visibility level (public/members/paid/tiers)
  "tags": ["string"],    // Optional: Tag IDs (24-char hex) or tag names; unknown names are created
  "feature_image": "string",         // Optional: Cover image URL
  "feature_image_alt": "string",     // Optional: Cover image alt text
  "feature_image_caption": "string", // Optional: Cover image caption
  "custom_excerpt": "string",        // Optional: Excerpt, max 300 characters
  "meta_title": "string",            // Optional: SEO title
  "meta_description": "string",      // Optional: SEO description
  "og_image": "string"               // Optional: Open Graph image URL
}
```

### update_post
Updates an existing post.

Input:
```json
{
  "id": "string",       // Required: Post ID
  "title": "string",    // Optional: Post title
  "html": "string",     // Optional: HTML content
  "lexical": "string",  // Optional: Lexical content
  "status": "string",   // Optional: Post status
  "tags": ["string"],   // Optional: Tag IDs or names (replaces existing tags)
  "feature_image": "string",         // Optional: Cover image URL
  "feature_image_alt": "string",     // Optional: Cover image alt text
  "feature_image_caption": "string", // Optional: Cover image caption
  "custom_excerpt": "string",        // Optional: Excerpt, max 300 characters
  "meta_title": "string",            // Optional: SEO title
  "meta_description": "string",      // Optional: SEO description
  "og_image": "string"               // Optional: Open Graph image URL
}
```

`html` and `lexical` are only sent to Ghost when supplied, so updating just the cover image or excerpt leaves the post content untouched. The current `updated_at` is fetched before every edit. `create_page` and `update_page` accept the same cover, excerpt, SEO and tag parameters.

Tag entries that are not a 24-character hex ID are sent as `{"name": "..."}`, which Ghost resolves to an existing tag or creates.

To set a generated cover: call `upload_image_from_url`, then pass its `ghost_url` as `feature_image`.

To inspect the request body without contacting Ghost, run `npm run build && node scripts/dry-run-update.mjs`.

### delete_post
Deletes a post.

Input:
```json
{
  "id": "string" // Required: Post ID
}
```

### get_pages
Retrieves a list of pages.

Input:
```json
{
  "limit": "number",     // Optional: Number of pages to retrieve (1-100, default: 10)
  "page": "number",      // Optional: Page number (default: 1)
  "order": "string",     // Optional: Sort order
  "formats": ["string"], // Optional: Content formats (html/mobiledoc/lexical)
  "include": ["string"]  // Optional: Related data to include (authors/tags)
}
```

### get_members
Retrieves a list of members.

Input:
```json
{
  "limit": "number",     // Optional: Number of members to retrieve (1-100, default: 10)
  "page": "number",      // Optional: Page number (default: 1)
  "order": "string",     // Optional: Sort order
  "include": ["string"]  // Optional: Related data to include (labels/newsletters)
}
```

### search_members
Searches for members.

Input:
```json
{
  "query": "string",     // Required: Search query
  "limit": "number",     // Optional: Number of members to retrieve (1-100, default: 10)
  "include": ["string"]  // Optional: Related data to include (labels/newsletters)
}
```

### upload_image
Uploads an image from Base64 data.

Input:
```json
{
  "file": "string",   // Required: Base64 encoded image data
  "purpose": "string" // Optional: Image purpose (image/profile_image/icon)
}
```

### upload_image_from_url
Downloads an image from a URL and uploads it to Ghost. Returns the permanent Ghost URL.

Input:
```json
{
  "url": "string",      // Required: Source URL of the image to download
  "filename": "string", // Optional: Desired filename (without extension)
  "purpose": "string",  // Optional: Image purpose (image/profile_image/icon, default: image)
  "ref": "string"       // Optional: Reference identifier for tracking
}
```

Output (success):
```json
{
  "success": true,
  "ghost_url": "https://your-ghost-blog.com/content/images/2025/12/image.png",
  "filename": "image.png",
  "size_bytes": 245678,
  "mime_type": "image/png"
}
```

Output (failure):
```json
{
  "success": false,
  "error": "Failed to download: 403 Forbidden"
}
```

Supported formats: PNG, JPEG, GIF, WebP, SVG. Maximum file size: 128MB.

### Debugging

Since MCP servers communicate over stdio, debugging can be challenging. We recommend using the [MCP Inspector](https://github.com/modelcontextprotocol/inspector), which is available as a package script:

```bash
npm run inspect
```

The Inspector will provide a URL to access debugging tools in your browser.

## License

MIT License