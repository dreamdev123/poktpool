import { HttpException, HttpStatus } from '@nestjs/common';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

const photoFileFilter = (_req, file, callback) => {
  if (!extname(file.originalname).match(/\.(jpg|jpeg|png|gif)$/)) {
    callback(new HttpException('You can only upload image files', HttpStatus.BAD_REQUEST), false);
  } else {
    callback(null, true);
  }
};

const editPhotoFileName = (_req, file, callback) => {
  const fileExtName = extname(file.originalname);
  callback(null, `${uuidv4()}${fileExtName}`);

  module.exports = {
    photoFileFilter,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    editPhotoFileName,
  };
};
