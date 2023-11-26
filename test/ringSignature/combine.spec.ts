import { Curve, CurveName, RingSignature, piSignature } from "../../src";
import { decrypt } from "../../src/encryption/encryption";
import {
  invalidParams,
  invalidPoint,
  invalidResponses,
  lengthMismatch,
  noEmptyMsg,
} from "../../src/errors";
import * as data from "../data";

const ed25519 = new Curve(CurveName.ED25519);
const secp256k1 = new Curve(CurveName.SECP256K1);

/**
 * Test the RingSignature.combine() method
 *
 * test if:
 * - the method returns a valid RingSignature object
 * - the method throws if the signer response is not valid
 * - the method throws if partialSig.message is ""
 * - the method throws if partialSig.ring is not valid
 * - the method throws if partialSig.responses is not valid
 * - the method throws if partialSig.pi is >= ring.length
 * - the method throws if partialSig.pi is < 0
 * - the method throws if partialSig.c is not valid
 * - the method throws if partialSig.cpi is not valid
 * - the method throws if partialSig.alpha is not valid
 */
describe("Test combine()", () => {
  /* ------------VALID PAYLOAD------------ */
  it("Should return a RingSignature object - secp256k1", () => {
    const enc_partialSig = RingSignature.partialSign(
      data.publicKeys_secp256k1,
      data.message,
      data.signerPubKey_secp256k1,
      secp256k1,
      data.signerEncryptionPubKey,
    );

    const partialSig = RingSignature.base64ToPartialSig(
      decrypt(enc_partialSig, data.signerPrivKey),
    );

    const signerResponse = piSignature(
      partialSig.alpha,
      partialSig.cpi,
      data.signerPrivKey,
      secp256k1,
    );

    expect(RingSignature.combine(partialSig, signerResponse)).toBeInstanceOf(
      RingSignature,
    );

    expect(RingSignature.combine(partialSig, signerResponse).verify()).toBe(true);
  });
  it("Should return a RingSignature object - ed25519", () => {
    const enc_partialSig = RingSignature.partialSign(
      data.publicKeys_ed25519,
      data.message,
      data.signerPubKey_ed25519,
      ed25519,
      data.signerEncryptionPubKey,
    );

    const partialSig = RingSignature.base64ToPartialSig(
      decrypt(enc_partialSig, data.signerPrivKey),
    );

    const signerResponse = piSignature(
      partialSig.alpha,
      partialSig.cpi,
      data.signerPrivKey,
      ed25519,
    );

    expect(RingSignature.combine(partialSig, signerResponse)).toBeInstanceOf(
      RingSignature,
    );
  });

  /* ------------INVALID PAYLOAD------------ */
  it("Should throw if the signer response is 0 - secp256k1", () => {
    const enc_partialSig = RingSignature.partialSign(
      data.publicKeys_secp256k1,
      data.message,
      data.signerPubKey_secp256k1,
      secp256k1,
      data.signerEncryptionPubKey,
    );

    const partialSig = RingSignature.base64ToPartialSig(
      decrypt(enc_partialSig, data.signerPrivKey),
    );

    expect(() => {
      RingSignature.combine(partialSig, 0n);
    }).toThrow("At least one response is not valid");
  });
  it("Should throw if the signer response is 0 - ed25519", () => {
    const enc_partialSig = RingSignature.partialSign(
      data.publicKeys_ed25519,
      data.message,
      data.signerPubKey_ed25519,
      ed25519,
      data.signerEncryptionPubKey,
    );

    const partialSig = RingSignature.base64ToPartialSig(
      decrypt(enc_partialSig, data.signerPrivKey),
    );

    expect(() => {
      RingSignature.combine(partialSig, 0n);
    }).toThrow("At least one response is not valid");
  });

  it("Should throw if the message is empty - secp256k1", () => {
    const partialSig = {
      message: data.emptyMessage,
      ring: data.publicKeys_secp256k1,
      pi: 1,
      c: 2n,
      cpi: 2n,
      alpha: 2n,
      responses: data.randomResponses,
      curve: secp256k1,
    };

    const signerResponse = piSignature(
      partialSig.alpha,
      partialSig.cpi,
      data.signerPrivKey,
      secp256k1,
    );

    expect(() => {
      RingSignature.combine(partialSig, signerResponse);
    }).toThrow(noEmptyMsg);
  });

  it("Should throw if the message is empty - ed25519", () => {
    const partialSig = {
      message: data.emptyMessage,
      ring: data.publicKeys_ed25519,
      pi: 1,
      c: 2n,
      cpi: 2n,
      alpha: 2n,
      responses: data.randomResponses,
      curve: ed25519,
    };

    const signerResponse = piSignature(
      partialSig.alpha,
      partialSig.cpi,
      data.signerPrivKey,
      ed25519,
    );

    expect(() => {
      RingSignature.combine(partialSig, signerResponse);
    }).toThrow(noEmptyMsg);
  });

  it("Should throw if the ring is empty - secp256k1", () => {
    const partialSig = {
      message: data.message,
      ring: [],
      pi: 1,
      c: 2n,
      cpi: 2n,
      alpha: 2n,
      responses: data.randomResponses,
      curve: secp256k1,
    };

    const signerResponse = piSignature(
      partialSig.alpha,
      partialSig.cpi,
      data.signerPrivKey,
      secp256k1,
    );

    expect(() => {
      RingSignature.combine(partialSig, signerResponse);
    }).toThrow(); // 2 msg possible: noEmptyRing or "invalidParam('pi must be < ring.length')"
  });
  it("Should throw if the ring is empty - ed25519", () => {
    const partialSig = {
      message: data.message,
      ring: [],
      pi: 1,
      c: 2n,
      cpi: 2n,
      alpha: 2n,
      responses: data.randomResponses,
      curve: ed25519,
    };

    const signerResponse = piSignature(
      partialSig.alpha,
      partialSig.cpi,
      data.signerPrivKey,
      ed25519,
    );

    expect(() => {
      RingSignature.combine(partialSig, signerResponse);
    }).toThrow(); // 2 msg possible: noEmptyRing or "invalidParam('pi must be < ring.length')"
  });

  it("Should throw if the ring is not valid - secp256k1", () => {
    const partialSig = {
      message: data.message,
      ring: data.publicKeys_secp256k1.slice(1).concat(data.idPoint_secp256k1),
      pi: 1,
      c: 2n,
      cpi: 2n,
      alpha: 2n,
      responses: data.randomResponses,
      curve: secp256k1,
    };

    const signerResponse = piSignature(
      partialSig.alpha,
      partialSig.cpi,
      data.signerPrivKey,
      secp256k1,
    );

    expect(() => {
      RingSignature.combine(partialSig, signerResponse);
    }).toThrow(
      invalidPoint(
        // eslint-disable-next-line max-len
        'At least one point is not valid: Error: Invalid param: Point is not on curve: {"curve":"{\\"curve\\":\\"SECP256K1\\",\\"Gx\\":\\"55066263022277343669578718895168534326250603453777594175500187360389116729240\\",\\"Gy\\":\\"32670510020758816978083085130507043184471273380659243275938904335757337482424\\",\\"N\\":\\"115792089237316195423570985008687907852837564279074904382605163141518161494337\\",\\"P\\":\\"115792089237316195423570985008687907853269984665640564039457584007908834671663\\"}","x":"0","y":"0"}',
      ),
    );
  });
  it("Should throw if the ring is not valid - ed25519", () => {
    const partialSig = {
      message: data.message,
      ring: data.publicKeys_ed25519.slice(1).concat(data.idPoint_ed25519),
      pi: 1,
      c: 2n,
      cpi: 2n,
      alpha: 2n,
      responses: data.randomResponses,
      curve: ed25519,
    };

    const signerResponse = piSignature(
      partialSig.alpha,
      partialSig.cpi,
      data.signerPrivKey,
      ed25519,
    );

    expect(() => {
      RingSignature.combine(partialSig, signerResponse);
    }).toThrow(
      invalidPoint(
        // eslint-disable-next-line max-len
        'At least one point is not valid: Error: Invalid param: Point is not on curve: {"curve":"{\\"curve\\":\\"ED25519\\",\\"Gx\\":\\"15112221349535400772501151409588531511454012693041857206046113283949847762202\\",\\"Gy\\":\\"46316835694926478169428394003475163141307993866256225615783033603165251855960\\",\\"N\\":\\"7237005577332262213973186563042994240857116359379907606001950938285454250989\\",\\"P\\":\\"57896044618658097711785492504343953926634992332820282019728792003956564819949\\"}","x":"0","y":"0"}',
      ),
    );
  });

  it("Should throw if the responses are empty - secp256k1", () => {
    const partialSig = {
      message: data.message,
      ring: data.publicKeys_secp256k1,
      pi: 1,
      c: 2n,
      cpi: 2n,
      alpha: 2n,
      responses: [],
      curve: secp256k1,
    };

    const signerResponse = piSignature(
      partialSig.alpha,
      partialSig.cpi,
      data.signerPrivKey,
      secp256k1,
    );

    expect(() => {
      RingSignature.combine(partialSig, signerResponse);
    }).toThrow(lengthMismatch("ring", "responses"));
  });
  it("Should throw if the responses are empty - ed25519", () => {
    const partialSig = {
      message: data.message,
      ring: data.publicKeys_ed25519,
      pi: 1,
      c: 2n,
      cpi: 2n,
      alpha: 2n,
      responses: [],
      curve: ed25519,
    };

    const signerResponse = piSignature(
      partialSig.alpha,
      partialSig.cpi,
      data.signerPrivKey,
      ed25519,
    );

    expect(() => {
      RingSignature.combine(partialSig, signerResponse);
    }).toThrow(lengthMismatch("ring", "responses"));
  });

  it("Should throw if at least 1 response is 0 - secp256k1", () => {
    const partialSig = {
      message: data.message,
      ring: data.publicKeys_secp256k1,
      pi: 1,
      c: 2n,
      cpi: 2n,
      alpha: 2n,
      responses: [0n, ...data.randomResponses.slice(1)],
      curve: secp256k1,
    };

    const signerResponse = piSignature(
      partialSig.alpha,
      partialSig.cpi,
      data.signerPrivKey,
      secp256k1,
    );

    expect(() => {
      RingSignature.combine(partialSig, signerResponse);
    }).toThrow(invalidResponses);
  });
  it("Should throw if at least 1 response is 0 - ed25519", () => {
    const partialSig = {
      message: data.message,
      ring: data.publicKeys_ed25519,
      pi: 1,
      c: 2n,
      cpi: 2n,
      alpha: 2n,
      responses: [0n, ...data.randomResponses.slice(1)],
      curve: ed25519,
    };

    const signerResponse = piSignature(
      partialSig.alpha,
      partialSig.cpi,
      data.signerPrivKey,
      ed25519,
    );

    expect(() => {
      RingSignature.combine(partialSig, signerResponse);
    }).toThrow(invalidResponses);
  });

  it("Should throw if pi is >= ring.length - secp256k1", () => {
    const partialSig = {
      message: data.message,
      ring: data.publicKeys_secp256k1,
      pi: data.publicKeys_secp256k1.length,
      c: 2n,
      cpi: 2n,
      alpha: 2n,
      responses: data.randomResponses,
      curve: secp256k1,
    };

    const signerResponse = piSignature(
      partialSig.alpha,
      partialSig.cpi,
      data.signerPrivKey,
      secp256k1,
    );

    expect(() => {
      RingSignature.combine(partialSig, signerResponse);
    }).toThrow(invalidParams("pi must be < ring.length"));
  });
  it("Should throw if pi is >= ring.length - ed25519", () => {
    const partialSig = {
      message: data.message,
      ring: data.publicKeys_ed25519,
      pi: data.publicKeys_ed25519.length,
      c: 2n,
      cpi: 2n,
      alpha: 2n,
      responses: data.randomResponses,
      curve: ed25519,
    };

    const signerResponse = piSignature(
      partialSig.alpha,
      partialSig.cpi,
      data.signerPrivKey,
      ed25519,
    );

    expect(() => {
      RingSignature.combine(partialSig, signerResponse);
    }).toThrow(invalidParams("pi must be < ring.length"));
  });

  it("Should throw if pi is < 0 - secp256k1", () => {
    const partialSig = {
      message: data.message,
      ring: data.publicKeys_secp256k1,
      pi: -1,
      c: 2n,
      cpi: 2n,
      alpha: 2n,
      responses: data.randomResponses,
      curve: secp256k1,
    };

    const signerResponse = piSignature(
      partialSig.alpha,
      partialSig.cpi,
      data.signerPrivKey,
      secp256k1,
    );

    expect(() => {
      RingSignature.combine(partialSig, signerResponse);
    }).toThrow(invalidParams("pi must be >= 0"));
  });

  it("Should throw if pi is < 0 - ed25519", () => {
    const partialSig = {
      message: data.message,
      ring: data.publicKeys_ed25519,
      pi: -1,
      c: 2n,
      cpi: 2n,
      alpha: 2n,
      responses: data.randomResponses,
      curve: ed25519,
    };

    const signerResponse = piSignature(
      partialSig.alpha,
      partialSig.cpi,
      data.signerPrivKey,
      ed25519,
    );

    expect(() => {
      RingSignature.combine(partialSig, signerResponse);
    }).toThrow(invalidParams("pi must be >= 0"));
  });

  it("Should throw if c is 0 - secp256k1", () => {
    const partialSig = {
      message: data.message,
      ring: data.publicKeys_secp256k1,
      pi: 1,
      c: 0n,
      cpi: 2n,
      alpha: 2n,
      responses: data.randomResponses,
      curve: secp256k1,
    };

    expect(() => {
      RingSignature.combine(partialSig, 1n);
    }).toThrow(invalidParams("c"));
  });
  it("Should throw if c is 0 - ed25519", () => {
    const partialSig = {
      message: data.message,
      ring: data.publicKeys_ed25519,
      pi: 1,
      c: 0n,
      cpi: 2n,
      alpha: 2n,
      responses: data.randomResponses,
      curve: ed25519,
    };

    expect(() => {
      RingSignature.combine(partialSig, 1n);
    }).toThrow(invalidParams("c"));
  });

  it("Should throw if cpi is 0 - secp256k1", () => {
    const partialSig = {
      message: data.message,
      ring: data.publicKeys_secp256k1,
      pi: 1,
      c: 2n,
      cpi: 0n,
      alpha: 2n,
      responses: data.randomResponses,
      curve: secp256k1,
    };

    expect(() => {
      RingSignature.combine(partialSig, 1n);
    }).toThrow(invalidParams("cpi must be > 0"));
  });
  it("Should throw if cpi is 0 - ed25519", () => {
    const partialSig = {
      message: data.message,
      ring: data.publicKeys_ed25519,
      pi: 1,
      c: 2n,
      cpi: 0n,
      alpha: 2n,
      responses: data.randomResponses,
      curve: ed25519,
    };

    expect(() => {
      RingSignature.combine(partialSig, 1n);
    }).toThrow(invalidParams("cpi must be > 0"));
  });

  it("Should throw if alpha is 0 - secp256k1", () => {
    const partialSig = {
      message: data.message,
      ring: data.publicKeys_secp256k1,
      pi: 1,
      c: 2n,
      cpi: 2n,
      alpha: 0n,
      responses: data.randomResponses,
      curve: secp256k1,
    };

    expect(() => {
      RingSignature.combine(partialSig, 1n);
    }).toThrow(invalidParams("alpha must be > 0"));
  });
  it("Should throw if alpha is 0 - ed25519", () => {
    const partialSig = {
      message: data.message,
      ring: data.publicKeys_ed25519,
      pi: 1,
      c: 2n,
      cpi: 2n,
      alpha: 0n,
      responses: data.randomResponses,
      curve: ed25519,
    };

    expect(() => {
      RingSignature.combine(partialSig, 1n);
    }).toThrow(invalidParams("alpha must be > 0"));
  });
});
