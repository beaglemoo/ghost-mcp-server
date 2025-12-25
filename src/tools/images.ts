import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import FormData from 'form-data';
import { createGhostApi } from '../config/config.js';
import { handleGhostApiError } from '../utils/error.js';
import { ImageUploadParams, isImageUploadParams, ImageResponse } from '../types/index.js';
import imageSize from 'image-size';

// Allowed image formats
const ALLOWED_FORMATS = {
  image: ['.webp', '.jpg', '.jpeg', '.gif', '.png', '.svg'],
  profile_image: ['.webp', '.jpg', '.jpeg', '.gif', '.png', '.svg'],
  icon: ['.webp', '.jpg', '.jpeg', '.gif', '.png', '.svg', '.ico']
};

// Maximum file size (2MB)
const MAX_FILE_SIZE = 2 * 1024 * 1024;

// Image format validation
const validateImageFormat = (buffer: Buffer, mimeType: string, purpose: string = 'image'): void => {
  // Check file size
  if (buffer.length > MAX_FILE_SIZE) {
    throw new McpError(
      ErrorCode.InvalidParams,
      `File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`
    );
  }

  // Get extension from MIME type
  const extension = `.${mimeType.split('/')[1]}`.toLowerCase();
  const allowedFormats = ALLOWED_FORMATS[purpose as keyof typeof ALLOWED_FORMATS];

  if (!allowedFormats.includes(extension)) {
    throw new McpError(
      ErrorCode.InvalidParams,
      `Invalid image format for ${purpose}. Allowed formats: ${allowedFormats.join(', ')}`
    );
  }

  // Add square dimension check for profile_image and icon
  if (purpose === 'profile_image' || purpose === 'icon') {
    try {
      const dimensions = imageSize.imageSize(buffer);
      if (!dimensions || dimensions.width !== dimensions.height) {
        throw new McpError(
          ErrorCode.InvalidParams,
          dimensions ? 
            `${purpose} must be square (current dimensions: ${dimensions.width}x${dimensions.height})` :
            `Failed to determine image dimensions`
        );
      }
    } catch (error) {
      if (error instanceof McpError) throw error;
      throw new McpError(
        ErrorCode.InvalidParams,
        'Failed to read image dimensions'
      );
    }
  }
};

// Convert Base64 to Buffer and extract MIME type
const parseBase64Image = (base64Data: string): { buffer: Buffer; mimeType: string } => {
  const matches = base64Data.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (!matches) {
    throw new McpError(
      ErrorCode.InvalidParams,
      'Invalid Base64 image data format'
    );
  }

  try {
    const [, mimeType, base64Image] = matches;
    const buffer = Buffer.from(base64Image, 'base64');
    return { buffer, mimeType };
  } catch (error) {
    throw new McpError(
      ErrorCode.InvalidParams,
      'Failed to decode Base64 image data'
    );
  }
};

// Image upload function
export const uploadImage = async (args: unknown): Promise<{ content: { url: string; ref?: string } }> => {
  if (!isImageUploadParams(args)) {
    throw new McpError(
      ErrorCode.InvalidParams,
      'Invalid image upload parameters'
    );
  }

  try {
    const { file, purpose, ref } = args;

    // Parse Base64 data to get buffer and MIME type
    const { buffer, mimeType } = parseBase64Image(file);

    // Validate image format
    validateImageFormat(buffer, mimeType, purpose);

    // Build FormData
    const formData = new FormData() as any;
    formData.append('file', buffer, {
      filename: `image${mimeType.replace('image/', '.')}`,
      contentType: mimeType
    });
    if (purpose) formData.append('purpose', purpose);
    if (ref) formData.append('ref', ref);

    // Create Ghost Admin API client
    const api = createGhostApi();

    // Send image upload request
    const response = await api.images.upload({
      file: formData,
      purpose,
      ref
    });

    return {
      content: {
        url: response.url,
        ref: response.ref
      }
    };
  } catch (error) {
    return handleGhostApiError(error);
  }
};

// Tool schema definition
export const uploadImageSchema = {
  name: 'upload_image',
  description: 'Upload an image',
  inputSchema: {
    type: 'object',
    properties: {
      file: {
        type: 'string',
        description: 'Image file to upload (Base64)'
      },
      purpose: {
        type: 'string',
        description: 'Image purpose',
        enum: ['image', 'profile_image', 'icon']
      },
      ref: {
        type: 'string',
        description: 'Image reference info (optional)'
      }
    },
    required: ['file']
  }
};