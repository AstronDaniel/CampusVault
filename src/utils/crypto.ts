import CryptoJS from 'crypto-js';
import ReactNativeBlobUtil from 'react-native-blob-util';

export interface FileInfo {
  uri: string;
  name?: string;
  type?: string;
  size?: number;
  lastModified?: number;
}

export interface HashResult {
  hash: string;
  fileInfo: FileInfo;
  computationTime: number;
  method: 'native' | 'javascript';
  error?: string;
}

export interface HashOptions {
  showLogs?: boolean;
  useNativeFirst?: boolean;
  chunkSize?: number; // in bytes
  onProgress?: (progress: number) => void;
}

/**
 * Main utility class for file hash computation
 */
class FileHashComputer {
  private options: HashOptions;
  
  constructor(options: HashOptions = {}) {
    this.options = {
      showLogs: true,
      useNativeFirst: true,
      chunkSize: 1024 * 1024, // 1MB chunks
      onProgress: undefined,
      ...options
    };
  }

  /**
   * Compute SHA256 hash of a file
   */
  async computeSHA256(fileUri: string): Promise<HashResult> {
    const startTime = Date.now();
    const log = this.options.showLogs ? console.log : () => {};
    const warn = this.options.showLogs ? console.warn : () => {};
    const error = this.options.showLogs ? console.error : () => {};
    
    try {
      log('🔐 ===== SHA256 COMPUTATION STARTED =====');
      log('📄 File URI:', fileUri);
      
      // Step 1: Get basic file info (skip detailed stat for content:// URIs)
      log('📋 Step 1: Getting file information...');
      if (this.options.onProgress) this.options.onProgress(10);
      
      let fileInfo: FileInfo;
      const isContentUri = fileUri.startsWith('content://');
      
      if (isContentUri) {
        // For content:// URIs, extract filename only (skip stat)
        const pathParts = decodeURIComponent(fileUri).split('/');
        let name = pathParts[pathParts.length - 1] || 'Unknown';
        const queryIndex = name.indexOf('?');
        if (queryIndex > -1) {
          name = name.substring(0, queryIndex);
        }
        
        fileInfo = {
          uri: fileUri,
          name,
          size: 0 // Will be determined after reading
        };
        log('✅ File info (content URI):', { name: fileInfo.name });
      } else {
        // For file:// URIs, get full stats
        fileInfo = await this.getFileInfo(fileUri);
        log('✅ File info retrieved:', {
          name: fileInfo.name,
          size: fileInfo.size,
          type: fileInfo.type
        });
      }

      // Step 2: Compute hash
      log('🔐 Step 2: Computing SHA256...');
      if (this.options.onProgress) this.options.onProgress(30);
      
      let hash: string;
      let method: 'native' | 'javascript';
      
      // Always try native first for content:// URIs (it's the only method that works reliably)
      try {
        hash = await this.computeSHA256Native(fileUri);
        method = 'native';
        log('⚡ Used native method (fastest)');
      } catch (nativeError) {
        const errorMessage = nativeError instanceof Error ? nativeError.message : 'Unknown error';
        warn('⚠️ Native method failed, falling back to JavaScript:', errorMessage);
        
        // JavaScript fallback requires file size
        if (!fileInfo.size || fileInfo.size === 0) {
          throw new Error('Cannot use JavaScript fallback without file size. Native method failed: ' + errorMessage);
        }
        
        hash = await this.computeSHA256JavaScript(fileUri, fileInfo.size);
        method = 'javascript';
        log('🔄 Used JavaScript method (fallback)');
      }

      // Step 3: Validate hash
      const isValid = this.validateHash(hash);
      if (!isValid) {
        warn('⚠️ Hash validation failed - unexpected format');
      }

      // Step 4: Complete
      if (this.options.onProgress) this.options.onProgress(100);
      
      const computationTime = Date.now() - startTime;
      
      log('✅ SHA256 computed successfully!');
      log('🔑 Hash:', hash);
      log('📏 Length:', hash.length, 'characters');
      log('⚡ Method:', method);
      log('⏱️  Time:', computationTime + 'ms');
      
      if (fileInfo.size) {
        const speedKBps = fileInfo.size / 1024 / (computationTime / 1000);
        log('📈 Speed:', speedKBps.toFixed(2) + ' KB/s');
      }
      
      log('🏁 ===== COMPUTATION COMPLETE =====\n');

      return {
        hash,
        fileInfo,
        computationTime,
        method
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      error('❌ SHA256 computation failed:', err);
      
      return {
        hash: '',
        fileInfo: { uri: fileUri },
        computationTime: Date.now() - startTime,
        method: 'javascript',
        error: errorMessage
      };
    }
  }

  /**
   * Get detailed file information
   */
  private async getFileInfo(uri: string): Promise<FileInfo> {
    try {
      // ReactNativeBlobUtil handles content:// URIs directly
      const stats = await ReactNativeBlobUtil.fs.stat(uri);
      
      // Extract filename from URI (decode URI components)
      let name = '';
      const pathParts = decodeURIComponent(uri).split('/');
      name = pathParts[pathParts.length - 1] || 'Unknown';
      
      // Clean up query parameters if present
      const queryIndex = name.indexOf('?');
      if (queryIndex > -1) {
        name = name.substring(0, queryIndex);
      }
      
      // Extract file extension
      const extension = name.includes('.') 
        ? name.substring(name.lastIndexOf('.') + 1).toLowerCase()
        : '';

      return {
        uri,
        name,
        size: parseInt(String(stats.size)) || 0,
        type: stats.type || this.getMimeType(extension),
        lastModified: stats.lastModified ? parseInt(String(stats.lastModified)) : undefined
      };
    } catch (error) {
      throw new Error(`Failed to get file info: ${error}`);
    }
  }

  /**
   * Compute SHA256 using native method (fastest)
   */
  private async computeSHA256Native(uri: string): Promise<string> {
    try {
      // ReactNativeBlobUtil handles content:// URIs directly
      const hash = await ReactNativeBlobUtil.fs.hash(uri, 'sha256');
      const hashHex = hash.toLowerCase();
      
      // Basic validation
      if (!hashHex || hashHex.length !== 64) {
        throw new Error(`Invalid native hash: ${hashHex}`);
      }
      
      return hashHex;
    } catch (error) {
      throw new Error(`Native hash computation failed: ${error}`);
    }
  }

  /**
   * Compute SHA256 using JavaScript (fallback)
   */
  private async computeSHA256JavaScript(uri: string, fileSize: number): Promise<string> {
    const log = this.options.showLogs ? console.log : () => {};
    
    log(`🔄 JavaScript method: Processing ${(fileSize / 1024 / 1024).toFixed(2)} MB file`);
    
    try {
      if (this.options.onProgress) this.options.onProgress(40);
      
      // ReactNativeBlobUtil handles content:// URIs directly
      const base64Data = await ReactNativeBlobUtil.fs.readFile(uri, 'base64');
      
      if (this.options.onProgress) this.options.onProgress(60);
      
      // Parse and hash
      const wordArray = CryptoJS.enc.Base64.parse(base64Data);
      
      if (this.options.onProgress) this.options.onProgress(80);
      
      const hash = CryptoJS.SHA256(wordArray);
      const hashHex = hash.toString(CryptoJS.enc.Hex).toLowerCase();
      
      // Validate
      if (!hashHex || hashHex.length !== 64) {
        throw new Error(`Invalid JavaScript hash: ${hashHex}`);
      }
      
      return hashHex;
    } catch (error) {
      throw new Error(`JavaScript hash computation failed: ${error}`);
    }
  }

  /**
   * Validate hash format
   */
  private validateHash(hash: string): boolean {
    if (!hash) return false;
    if (hash.length !== 64) return false;
    if (!/^[a-f0-9]{64}$/.test(hash)) return false;
    return true;
  }

  /**
   * Get MIME type from file extension
   */
  private getMimeType(extension: string): string {
    const mimeTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'txt': 'text/plain',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'zip': 'application/zip',
      'rar': 'application/x-rar-compressed',
    };
    
    return mimeTypes[extension] || 'application/octet-stream';
  }
}

/**
 * Singleton instance for easy use
 */
const defaultComputer = new FileHashComputer({ showLogs: true });

/**
 * Export simple function interface
 */
export const computeFileSHA256 = async (
  fileUri: string, 
  options: HashOptions = {}
): Promise<HashResult> => {
  const computer = new FileHashComputer(options);
  return computer.computeSHA256(fileUri);
};

/**
 * Quick hash without detailed info
 */
export const getFileHash = async (
  fileUri: string,
  showLogs: boolean = true
): Promise<string> => {
  const result = await computeFileSHA256(fileUri, { showLogs });
  if (result.error) {
    throw new Error(result.error);
  }
  return result.hash;
};

/**
 * Legacy function for compatibility with existing code
 */
export async function testFileSHA256(fileUri: string): Promise<void> {
  console.log('🔍 TESTING FILE HASH COMPUTATION...');
  console.log('📄 File URI:', fileUri);
  
  try {
    const result = await computeFileSHA256(fileUri);
    
    console.log('✅ TEST COMPLETE');
    console.log('📊 File size:', result.fileInfo.size, 'bytes');
    console.log('🔑 SHA256:', result.hash);
    console.log('⏱️  Time:', result.computationTime + 'ms');
    console.log('⚡ Method:', result.method);
  } catch (error) {
    console.error('❌ TEST FAILED:', error);
    throw error;
  }
}

/**
 * Batch compute hashes for multiple files
 */
export const batchComputeHashes = async (
  fileUris: string[],
  options: HashOptions = {}
): Promise<HashResult[]> => {
  console.log(`🔢 Batch computing hashes for ${fileUris.length} files...`);
  
  const results: HashResult[] = [];
  const computer = new FileHashComputer({ ...options, showLogs: false });
  
  for (let i = 0; i < fileUris.length; i++) {
    const uri = fileUris[i];
    console.log(`📄 Processing file ${i + 1}/${fileUris.length}: ${uri}`);
    
    try {
      const result = await computer.computeSHA256(uri);
      results.push(result);
      console.log(`✅ File ${i + 1} completed`);
    } catch (error) {
      console.error(`❌ File ${i + 1} failed:`, error);
      results.push({
        hash: '',
        fileInfo: { uri },
        computationTime: 0,
        method: 'javascript',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  console.log('🏁 Batch computation complete');
  return results;
};

export default FileHashComputer;