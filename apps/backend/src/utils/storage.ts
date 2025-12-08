import { v4 as uuidv4 } from 'uuid';

/**
 * Simple storage utility for file uploads
 * In production, this would integrate with cloud storage like AWS S3, Google Cloud Storage, etc.
 */
export async function uploadToStorage(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  // In a real implementation, this would upload to cloud storage
  // For now, we'll return a mock URL
  const fileId = uuidv4();
  const extension = fileName.split('.').pop() || 'bin';
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  // Mock URL - in production this would be the actual cloud storage URL
  return `https://storage.dorce.ai/uploads/${fileId}/${cleanFileName}`;
}

/**
 * Generate a unique filename for uploaded files
 */
export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomId = uuidv4().substring(0, 8);
  const extension = originalName.split('.').pop() || '';
  const cleanName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 50);
  
  return `${timestamp}-${randomId}-${cleanName}.${extension}`;
}

/**
 * Validate file upload
 */
export function validateFileUpload(
  file: any, // Express.Multer.File
  options: {
    maxSize?: number;
    allowedTypes?: string[];
  } = {}
): { valid: boolean; error?: string } {
  const maxSize = options.maxSize || 5 * 1024 * 1024; // 5MB default
  const allowedTypes = options.allowedTypes || [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/plain',
  ];

  if (file.size > maxSize) {
    return { valid: false, error: `File size exceeds ${maxSize / (1024 * 1024)}MB limit` };
  }

  if (!allowedTypes.includes(file.mimetype)) {
    return { valid: false, error: `File type ${file.mimetype} is not allowed` };
  }

  return { valid: true };
}