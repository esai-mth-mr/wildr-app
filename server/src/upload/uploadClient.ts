import { FileUpload } from 'graphql-upload';
import { UploadFile } from '../data/common';
import { ReadStream } from 'fs-capacitor';
import { createWriteStream, unlink } from 'fs';
import { extension } from 'mime-types';
import { generateId } from '../common/generateId';

export const uploadFile = async (
  upload: Promise<FileUpload>
): Promise<UploadFile> => {
  const result = await upload;
  const { mimetype, encoding, createReadStream } = result;
  const stream: ReadStream = createReadStream();
  const id = generateId();
  const filename = `${id}.${extension(mimetype)}`;
  const path = `uploads/${filename}`;
  const file: UploadFile = {
    __typename: 'UploadFile',
    id,
    filename,
    mimetype,
    encoding,
    path,
  };
  await new Promise((resolve, reject) => {
    const writeStream = createWriteStream(path);
    writeStream.on('finish', resolve);
    // If there's an error writing the file, remove the partially written file
    // and reject the promise.
    writeStream.on('error', error => {
      unlink(path, () => {
        reject(error);
      });
    });

    // In Node.js <= v13, errors are not automatically propagated between piped
    // streams. If there is an error receiving the upload, destroy the write
    // stream with the corresponding error.
    stream.on('error', error => writeStream.destroy(error));

    // Pipe the upload into the write stream.
    stream.pipe(writeStream);
  });
  return file;
};
