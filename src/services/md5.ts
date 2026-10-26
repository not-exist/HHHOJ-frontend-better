import md5 from 'blueimp-md5'

/** 与 HHHOJ frontend/src/config.ts 保持一致 */
const CLIENT_SALT = 'IsVmReCClDLEBJGHemt9ZsIqxPambZFR'

export function hashPassword(password: string): string {
  return md5(password, CLIENT_SALT)
}
