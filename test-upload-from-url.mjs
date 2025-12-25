// ABOUTME: Test script for upload_image_from_url functionality.
// ABOUTME: Run with: node test-upload-from-url.mjs <image-url>

import { uploadImageFromUrl } from './build/tools/images.js';

async function main() {
  const url = process.argv[2];

  if (!url) {
    console.error('Usage: node test-upload-from-url.mjs <image-url>');
    console.error('');
    console.error('Example:');
    console.error('  node test-upload-from-url.mjs "https://example.com/image.png"');
    process.exit(1);
  }

  // Check for required env vars
  if (!process.env.GHOST_API_URL || !process.env.GHOST_ADMIN_API_KEY) {
    console.error('Missing required environment variables:');
    console.error('  GHOST_API_URL - Your Ghost instance URL');
    console.error('  GHOST_ADMIN_API_KEY - Your Ghost Admin API key');
    process.exit(1);
  }

  console.log('Testing upload_image_from_url...');
  console.log('URL:', url.substring(0, 80) + (url.length > 80 ? '...' : ''));
  console.log('');

  try {
    const result = await uploadImageFromUrl({
      url,
      filename: 'test-upload-' + Date.now(),
      purpose: 'image'
    });

    const response = JSON.parse(result.content[0].text);

    if (response.success) {
      console.log('✅ Upload successful!');
      console.log('');
      console.log('Ghost URL:', response.ghost_url);
      console.log('Filename:', response.filename);
      console.log('Size:', (response.size_bytes / 1024).toFixed(2), 'KB');
      console.log('MIME type:', response.mime_type);
    } else {
      console.log('❌ Upload failed!');
      console.log('');
      console.log('Error:', response.error);
    }
  } catch (error) {
    console.error('❌ Exception thrown:');
    console.error(error);
    process.exit(1);
  }
}

main();
