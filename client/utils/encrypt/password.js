import {Base64} from 'js-base64';

export const encryptPassword = pw => {
  return Base64.encode(pw);
};

export const decryptPassword = b64 => {
  return Base64.decode(b64);
};
