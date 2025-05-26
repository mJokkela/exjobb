declare module 'multer-s3' {
  import { Request } from 'express';
  import { StorageEngine } from 'multer';
  import { S3Client } from '@aws-sdk/client-s3';

  export interface Options {
    s3: S3Client;
    bucket:
      | string
      | ((
          req: Request,
          file: Express.Multer.File,
          cb: (error: any, bucket?: string) => void
        ) => void);
    acl?: string;
    contentType?: any;
    metadata?: (
      req: Request,
      file: Express.Multer.File,
      cb: (error: any, metadata?: any) => void
    ) => void;
    key?: (
      req: Request,
      file: Express.Multer.File,
      cb: (error: any, key?: string) => void
    ) => void;
  }

  function multerS3(options: Options): StorageEngine;

  namespace multerS3 {
    const AUTO_CONTENT_TYPE: (req: Request, file: Express.Multer.File, cb: (error: any, mime?: string) => void) => void;
  }

  export = multerS3;
}
