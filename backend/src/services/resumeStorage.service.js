import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';
import { Readable } from 'stream';

const BUCKET_NAME = 'resumes';

let bucket;

function getBucket() {
  if (!mongoose.connection.db) {
    throw new Error('[RESUME STORAGE] MongoDB connection is not ready');
  }
  if (!bucket) {
    bucket = new GridFSBucket(mongoose.connection.db, { bucketName: BUCKET_NAME });
  }
  return bucket;
}

export async function uploadResume(buffer, filename, mimetype = 'application/pdf') {
  const b = getBucket();
  const uploadStream = b.openUploadStream(filename, { contentType: mimetype });

  await new Promise((resolve, reject) => {
    const readStream = Readable.from(buffer);
    readStream.pipe(uploadStream);
    uploadStream.on('error', reject);
    uploadStream.on('finish', resolve);
  });

  console.log(`[RESUME STORAGE] Uploaded GridFS file: ${uploadStream.id} (${filename})`);
  return uploadStream.id;
}

export async function getResumeBuffer(fileId) {
  const b = getBucket();
  const oid = fileId instanceof mongoose.Types.ObjectId ? fileId : new mongoose.Types.ObjectId(String(fileId));

  console.log(`[RESUME STORAGE] Reading GridFS file: ${oid}`);

  const chunks = [];
  const downloadStream = b.openDownloadStream(oid);

  await new Promise((resolve, reject) => {
    downloadStream.on('data', (chunk) => chunks.push(chunk));
    downloadStream.on('error', reject);
    downloadStream.on('end', resolve);
  });

  const buffer = Buffer.concat(chunks);
  console.log(`[RESUME STORAGE] Resume buffer loaded: ${(buffer.length / 1024).toFixed(1)} KB`);
  return buffer;
}

export async function deleteResume(fileId) {
  const b = getBucket();
  const oid = fileId instanceof mongoose.Types.ObjectId ? fileId : new mongoose.Types.ObjectId(String(fileId));
  await b.delete(oid);
  console.log(`[RESUME STORAGE] Deleted old GridFS file: ${oid}`);
}

export async function resumeExists(fileId) {
  const b = getBucket();
  const oid = fileId instanceof mongoose.Types.ObjectId ? fileId : new mongoose.Types.ObjectId(String(fileId));

  try {
    const files = await b.find({ _id: oid }).toArray();
    return files.length > 0;
  } catch {
    return false;
  }
}
