export { randomBigint, getRandomNumber } from "./randomNumbers";
export { modulo } from "./modulo";
export { formatRing } from "./formatData/formatRing";
export { keccak_256, hash, sha_512 } from "./hashFunction";
export const base64Regex =
  // eslint-disable-next-line no-useless-escape
  /^(?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$/;
