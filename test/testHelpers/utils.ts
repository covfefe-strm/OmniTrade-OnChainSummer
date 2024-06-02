export function addressToBytes32(address: string) {
  let res = "0x000000000000000000000000" + address.slice(2);
  return res;
}
