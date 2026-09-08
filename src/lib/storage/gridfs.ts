import { ObjectId, GridFSBucketReadStream } from 'mongodb';
import { Readable } from 'stream';
import { getGridFSBucket } from '../mongodb';

export interface GridFSUploadResult {
  fileId: ObjectId;
  filename: string;
  size: number;
  contentType: string;
}

export async function uploadFileToGridFS(
  buffer: Buffer,
  filename: string,
  contentType: string = 'application/octet-stream'
): Promise<GridFSUploadResult> {
  const bucket = await getGridFSBucket('fs');

  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, {
      metadata: {
        contentType: contentType,
        originalFilename: filename,
        uploadedAt: new Date(),
      },
    });

    const readable = Readable.from(buffer);

    readable.pipe(uploadStream);

    uploadStream.on('error', (err) => {
      reject(err);
    });

    uploadStream.on('finish', () => {
      resolve({
        fileId: uploadStream.id as ObjectId,
        filename: filename,
        size: buffer.length,
        contentType: contentType,
      });
    });
  });
}

export async function getGridFSDownloadStream(fileId: string | ObjectId): Promise<{
  stream: GridFSBucketReadStream;
  fileDoc: {
    _id: ObjectId;
    length: number;
    chunkSize: number;
    uploadDate: Date;
    filename: string;
    metadata?: {
      contentType?: string;
      originalFilename?: string;
      uploadedAt?: Date;
    };
  };
}> {
  const bucket = await getGridFSBucket('fs');
  const objectId = typeof fileId === 'string' ? new ObjectId(fileId) : fileId;

  const files = await bucket.find({ _id: objectId }).toArray();
  if (!files || files.length === 0) {
    throw new Error('File not found in GridFS');
  }

  const fileDoc = files[0];
  const stream = bucket.openDownloadStream(objectId);

  return {
    stream,
    fileDoc: fileDoc as unknown as {
      _id: ObjectId;
      length: number;
      chunkSize: number;
      uploadDate: Date;
      filename: string;
      metadata?: {
        contentType?: string;
        originalFilename?: string;
        uploadedAt?: Date;
      };
    },
  };
}

export async function deleteFileFromGridFS(fileId: string | ObjectId): Promise<boolean> {
  try {
    const bucket = await getGridFSBucket('fs');
    const objectId = typeof fileId === 'string' ? new ObjectId(fileId) : fileId;
    await bucket.delete(objectId);
    return true;
  } catch (err) {
    console.error('Error deleting file from GridFS:', err);
    return false;
  }
}
