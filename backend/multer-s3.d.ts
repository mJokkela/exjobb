declare module 'multer-s3' {
  import { StorageEngine } from 'multer';
  import { S3Client } from '@aws-sdk/client-s3';

  interface Options {
    s3: S3Client;
    bucket: string | ((req: any, file: any, cb: (error?: any, bucket?: string) => void) => void);
    acl?: string | ((req: any, file: any, cb: (error?: any, acl?: string) => void) => void);
    key?: (req: any, file: any, cb: (error?: any, key?: string) => void) => void;
    metadata?: (req: any, file: any, cb: (error?: any, metadata?: any) => void) => void;
  }

  function multerS3(options: Options): StorageEngine;

  export = multerS3;
}