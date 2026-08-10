const path = require('path');
const fs = require('fs');
const { Readable } = require('stream');
const cloudinary = require('cloudinary').v2;
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const { HTTP_STATUS } = require('../utils/constants');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Configure Cloudinary if credentials are provided
if (env.cloudinaryCloudName && env.cloudinaryApiKey && env.cloudinaryApiSecret) {
  cloudinary.config({
    cloud_name: env.cloudinaryCloudName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecret,
    secure: true,
  });
}

/**
 * Verifies in-memory buffer magic bytes against allowed MIME signatures
 */
function verifyBufferMagicBytes(buffer) {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length < 4) return false;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true;
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return true;
  // WEBP: 52 49 46 46 (RIFF) ... WEBP
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer.toString('utf8', 8, 12) === 'WEBP'
  )
    return true;
  // PDF: 25 50 44 46 (%PDF)
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) return true;
  // MP4: ftyp at byte offset 4
  if (buffer.length >= 8 && buffer.toString('utf8', 4, 8) === 'ftyp') return true;
  // WEBM / MKV: 1A 45 DF A3
  if (buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) return true;
  // WAV: RIFF ... WAVE
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer.toString('utf8', 8, 12) === 'WAVE'
  )
    return true;
  // MP3 ID3 header or Frame sync
  if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) return true;
  if (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) return true;

  return false;
}

class LocalUploadProvider {
  async saveFile(buffer, filename, subfolder = '') {
    const targetFolder = subfolder ? path.join(UPLOADS_DIR, subfolder) : UPLOADS_DIR;
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    const filePath = path.join(targetFolder, filename);
    await fs.promises.writeFile(filePath, buffer);

    const relativePath = subfolder ? `/uploads/${subfolder}/${filename}` : `/uploads/${filename}`;
    return relativePath;
  }

  async deleteFile(fileUrl) {
    if (!fileUrl || typeof fileUrl !== 'string') return;
    try {
      const relativePath = fileUrl.startsWith('/uploads/') ? fileUrl.replace('/uploads/', '') : fileUrl;
      const fullPath = path.resolve(UPLOADS_DIR, relativePath);
      const resolvedUploadsDir = path.resolve(UPLOADS_DIR);

      if (!fullPath.startsWith(resolvedUploadsDir + path.sep) && fullPath !== resolvedUploadsDir) {
        console.warn(`Attempted path traversal in deleteFile: ${fileUrl}`);
        return;
      }

      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
      }
    } catch (err) {
      console.warn(`Failed to delete local file: ${fileUrl}`, err.message);
    }
  }

  async copyFile(fileUrl, subfolder = '') {
    if (!fileUrl || typeof fileUrl !== 'string' || !fileUrl.startsWith('/uploads/')) return fileUrl;
    try {
      const relativePath = fileUrl.replace('/uploads/', '');
      const oldPath = path.join(UPLOADS_DIR, relativePath);
      if (!fs.existsSync(oldPath)) return fileUrl;

      const ext = path.extname(oldPath);
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const newFilename = `copy-${uniqueSuffix}${ext}`;

      const targetFolder = subfolder ? path.join(UPLOADS_DIR, subfolder) : path.dirname(oldPath);
      if (!fs.existsSync(targetFolder)) {
        fs.mkdirSync(targetFolder, { recursive: true });
      }
      const newPath = path.join(targetFolder, newFilename);
      await fs.promises.copyFile(oldPath, newPath);

      return subfolder ? `/uploads/${subfolder}/${newFilename}` : `/uploads/${newFilename}`;
    } catch (err) {
      console.warn(`Failed to copy local file ${fileUrl}:`, err.message);
      return fileUrl;
    }
  }
}

class CloudinaryUploadProvider {
  async saveFile(buffer, filename, subfolder = '') {
    return new Promise((resolve, reject) => {
      const folderPath = subfolder ? `broker-streets/${subfolder}` : 'broker-streets';
      const resourceType =
        subfolder === 'videos'
          ? 'video'
          : subfolder === 'audio' || subfolder === 'documents'
          ? 'raw'
          : 'auto';

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folderPath,
          resource_type: resourceType,
          use_filename: true,
          unique_filename: true,
        },
        (error, result) => {
          if (error) {
            return reject(
              new ApiError(
                HTTP_STATUS.INTERNAL_SERVER_ERROR,
                `Cloudinary upload error: ${error.message}`
              )
            );
          }
          resolve(result.secure_url);
        }
      );

      const stream = new Readable();
      stream._read = () => {};
      stream.push(buffer);
      stream.push(null);
      stream.pipe(uploadStream);
    });
  }

  async deleteFile(fileUrl) {
    if (!fileUrl || typeof fileUrl !== 'string' || !fileUrl.includes('cloudinary.com')) return;
    try {
      let resourceType = 'image';
      if (fileUrl.includes('/video/') || fileUrl.includes('/broker-streets/videos/')) {
        resourceType = 'video';
      } else if (fileUrl.includes('/raw/') || fileUrl.includes('/broker-streets/audio/') || fileUrl.includes('/broker-streets/documents/')) {
        resourceType = 'raw';
      }

      const urlParts = fileUrl.split('/upload/');
      if (urlParts.length < 2) return;
      const pathWithVersion = urlParts[1];
      const pathWithoutVersion = pathWithVersion.replace(/^v\d+\//, '');

      let publicId = pathWithoutVersion;
      if (resourceType !== 'raw') {
        const lastDotIndex = publicId.lastIndexOf('.');
        if (lastDotIndex > 0) {
          publicId = publicId.substring(0, lastDotIndex);
        }
      }

      const res = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      if (res && res.result !== 'ok') {
        console.warn(`Cloudinary destroy returned result '${res.result}' for public_id: ${publicId} (resource_type: ${resourceType})`);
      }
    } catch (err) {
      console.warn(`Failed to delete Cloudinary file: ${fileUrl}`, err.message);
    }
  }

  async copyFile(fileUrl, subfolder = '') {
    if (!fileUrl || typeof fileUrl !== 'string' || !fileUrl.includes('cloudinary.com')) return fileUrl;
    try {
      let resourceType = 'image';
      if (fileUrl.includes('/video/') || fileUrl.includes('/broker-streets/videos/')) {
        resourceType = 'video';
      } else if (fileUrl.includes('/raw/') || fileUrl.includes('/broker-streets/audio/') || fileUrl.includes('/broker-streets/documents/')) {
        resourceType = 'raw';
      }

      const folderPath = subfolder ? `broker-streets/${subfolder}` : 'broker-streets';
      const result = await cloudinary.uploader.upload(fileUrl, {
        folder: folderPath,
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
      });

      return result.secure_url;
    } catch (err) {
      console.warn(`Failed to copy Cloudinary file ${fileUrl}:`, err.message);
      return fileUrl;
    }
  }
}

class UploadService {
  constructor() {
    this.localProvider = new LocalUploadProvider();
    this.cloudinaryProvider = new CloudinaryUploadProvider();
  }

  get provider() {
    return env.uploadProvider === 'cloudinary' ? this.cloudinaryProvider : this.localProvider;
  }

  /**
   * Process and save uploaded file using memory buffer
   */
  async processFile(file, subfolder = '') {
    if (!file) return null;

    const buffer = file.buffer || (file.path && fs.existsSync(file.path) ? fs.readFileSync(file.path) : null);
    if (!buffer) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'No file content or buffer found');
    }

    const safeOriginalName = path.basename(file.originalname).replace(/[^a-zA-Z0-9_.-]/g, '_');

    // Magic byte verification per BACKEND_SPEC.md §13
    if (!verifyBufferMagicBytes(buffer)) {
      throw new ApiError(
        HTTP_STATUS.UNSUPPORTED_MEDIA_TYPE,
        `Magic byte validation failed for file '${safeOriginalName}'. Invalid or spoofed file type.`
      );
    }

    const ext = path.extname(safeOriginalName);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const filename = `${file.fieldname || 'file'}-${uniqueSuffix}${ext}`;

    const url = await this.provider.saveFile(buffer, filename, subfolder);

    return {
      url,
      name: safeOriginalName,
      filename,
      mimetype: file.mimetype,
      size: buffer.length,
    };
  }

  /**
   * Process array of uploaded files
   */
  async processFiles(files = [], subfolder = '') {
    if (!files || !Array.isArray(files) || files.length === 0) return [];
    const results = [];
    for (const file of files) {
      const processed = await this.processFile(file, subfolder);
      if (processed) results.push(processed);
    }
    return results;
  }

  /**
   * Helper to process multipart listing files (images, videos, document)
   */
  async processListingFiles(files) {
    if (!files) return {};
    const result = {};

    if (files.images && files.images.length > 0) {
      const processedImages = await this.processFiles(files.images, 'properties');
      result.images = processedImages.map((img) => img.url);
    }

    if (files.videos && files.videos.length > 0) {
      const processedVideos = await this.processFiles(files.videos, 'videos');
      result.videos = processedVideos.map((vid) => vid.url);
    }

    if (files.document && files.document[0]) {
      const processedDoc = await this.processFile(files.document[0], 'documents');
      if (processedDoc) {
        result.propertyDocument = {
          name: processedDoc.name,
          url: processedDoc.url,
          type: processedDoc.mimetype,
          size: processedDoc.size,
        };
      }
    }

    return result;
  }

  /**
   * Delete an existing uploaded file from local storage or Cloudinary
   */
  async deleteFile(fileUrl) {
    if (!fileUrl) return;
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      await this.cloudinaryProvider.deleteFile(fileUrl);
    } else if (fileUrl.startsWith('/uploads/')) {
      await this.localProvider.deleteFile(fileUrl);
    }
  }

  /**
   * Delete array of file URLs
   */
  async deleteFiles(fileUrls = []) {
    if (!fileUrls || !Array.isArray(fileUrls)) return;
    for (const url of fileUrls) {
      await this.deleteFile(url);
    }
  }

  /**
   * Copy an existing file URL to a new URL
   */
  async copyFile(fileUrl, subfolder = '') {
    if (!fileUrl) return null;
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      return await this.cloudinaryProvider.copyFile(fileUrl, subfolder);
    } else if (fileUrl.startsWith('/uploads/')) {
      return await this.localProvider.copyFile(fileUrl, subfolder);
    }
    return fileUrl;
  }

  /**
   * Copy an array of file URLs
   */
  async copyFiles(fileUrls = [], subfolder = '') {
    if (!fileUrls || !Array.isArray(fileUrls)) return [];
    const results = [];
    for (const url of fileUrls) {
      const copied = await this.copyFile(url, subfolder);
      if (copied) results.push(copied);
    }
    return results;
  }
}

module.exports = new UploadService();
