import { Curve, CurveName } from "../../src";

const secp256k1 = new Curve(CurveName.SECP256K1);
const ed25519 = new Curve(CurveName.ED25519);

/**
 * Test the Curve.toString() method
 *
 * test if:
 * - the method returns a point on the curve
 */
describe("Test toString()", () => {
  it("Should return a point on the same curve - secp256k1", () => {
    expect(secp256k1.toString()).toBe(
      // eslint-disable-next-line max-len
      '{"curve":"SECP256K1","Gx":"55066263022277343669578718895168534326250603453777594175500187360389116729240","Gy":"32670510020758816978083085130507043184471273380659243275938904335757337482424","N":"115792089237316195423570985008687907852837564279074904382605163141518161494337","P":"115792089237316195423570985008687907853269984665640564039457584007908834671663"}',
    );
  });

  it("Should return a point on the same curve - ed25519", () => {
    expect(ed25519.toString()).toBe(
      // eslint-disable-next-line max-len
      '{"curve":"ED25519","Gx":"15112221349535400772501151409588531511454012693041857206046113283949847762202","Gy":"46316835694926478169428394003475163141307993866256225615783033603165251855960","N":"7237005577332262213973186563042994240857116359379907606001950938285454250989","P":"57896044618658097711785492504343953926634992332820282019728792003956564819949"}',
    );
  });
});
