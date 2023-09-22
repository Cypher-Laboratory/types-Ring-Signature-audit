import { keccak256 } from "js-sha3";
import {
  SECP256K1,
  randomBigint,
  getRandomSecuredNumber,
  Curve,
  modulo,
  mult,
  add,
} from "./utils";
import { piSignature } from "./signature/piSignature";

/**
 * Ring signature interface
 *
 * @see message - Clear message
 * @see ring - Ring of public keys
 * @see cees - The first c value
 * @see responses - Responses for each public key in the ring
 */
export interface RingSig {
  message: string; // clear message
  ring: [[bigint, bigint]];
  c: bigint;
  responses: [bigint, bigint][];
  curve: Curve;
}

/**
 * Partial ring signature interface
 *
 * @see message - Clear message
 * @see ring - Ring of public keys
 * @see cees - c values
 * @see responses_0_pi - Fake responses from 0 to pi-1
 * @see responses_pi_n - Fake responses from pi+1 to n
 */
export interface PartialSignature {
  message: string;
  ring: [[bigint, bigint]];
  cees: bigint[];
  alpha: bigint;
  signerIndex: number;
  responses_0_pi: [bigint, bigint][];
  responses_pi_n: [bigint, bigint][];
  curve: Curve;
}

/**
 * Ring signature class.
 * This class is used to sign messages using ring signatures.
 * It can also be used to verify ring signatures.
 *
 * @remarks
 * For know, only SECP256K1 curve is fully supported.
 * ED25519 is on its way and then we would be able to sign using both curves at the same time
 */
export class RingSignature {
  message: string; // clear message
  c: bigint;
  responses: [bigint, bigint][];
  ring: [[bigint, bigint]];
  curve: Curve;

  /**
   * Ring signature class constructor
   *
   * @param message - Clear message to sign
   * @param ring - Ring of public keys
   * @param cees - c values
   * @param responses - Responses for each public key in the ring
   * @param curve - Curve used for the signature
   */
  constructor(
    message: string,
    ring: [[bigint, bigint]],
    c: bigint,
    responses: [bigint, bigint][],
    curve: Curve,
  ) {
    this.ring = ring;
    this.message = message;
    this.c = c;
    this.responses = responses;
    this.curve = curve;
  }

  /**
   * Create a RingSignature from a RingSig
   *
   * @param sig - The RingSig to convert
   *
   * @returns A RingSignature
   */
  static fromRingSig(sig: RingSig): RingSignature {
    return new RingSignature(
      sig.message,
      sig.ring,
      sig.c,
      sig.responses,
      sig.curve,
    );
  }

  /**
   * Transform a RingSignature into a RingSig
   *
   * @returns A RingSig
   */
  toRingSig(): RingSig {
    return {
      message: this.message,
      ring: this.ring,
      c: this.c,
      responses: this.responses,
      curve: this.curve,
    };
  }

  /**
   * Sign a message using ring signatures
   *
   * @param ring - Ring of public keys (does not contain the signer public key)
   * @param signerPrivKey - Private key of the signer
   * @param message - Clear message to sign
   *
   * @returns A RingSignature
   */
  static sign(
    ring: [[bigint, bigint]], // ring.length = n
    signerPrivKey: bigint,
    message: string,
    curve = Curve.SECP256K1,
  ): RingSignature {
    let P: bigint; // order of the curve
    let G: [bigint, bigint]; // generator point

    switch (curve) {
      case Curve.SECP256K1:
        P = SECP256K1.P;
        G = SECP256K1.G;
        break;
      case Curve.ED25519:
        throw new Error("ED25519 signing is not implemented yet");
      default:
        throw new Error("unknown curve");
    }

    // hash the message
    const messageDigest = keccak256(message);

    // generate random number alpha
    const alpha = randomBigint(P);

    // set the signer position in the ring
    if (curve !== Curve.SECP256K1) throw new Error("Curve not supported");

    const signerPubKey = mult(signerPrivKey, G);

    const pi = getRandomSecuredNumber(0, ring.length - 1); // signer index
    // add the signer public key to the ring
    ring = ring.slice(0, pi).concat([signerPubKey], ring.slice(pi)) as [
      [bigint, bigint],
    ];

    // check for duplicates
    for (let i = 0; i < ring.length; i++) {
      // complexity.. :(
      for (let j = i + 1; j < ring.length; j++) {
        if (ring[i][0] === ring[j][0] && ring[i][1] === ring[j][1]) {
          throw new Error("Ring contains duplicate public keys");
        }
      }
    }

    // generate random fake responses for everybody except the signer
    const responses: [bigint, bigint][] = [];
    for (let i = 0; i < ring.length; i++) {
      responses.push(mult(randomBigint(P), G));
    }

    // supposed to contains all the cees from pi+1 to n (pi+1, pi+2, ..., n)(n = ring.length)
    const cValuesPI1N: bigint[] = [];

    // compute C pi+1
    cValuesPI1N.push(
      BigInt(
        "0x" +
          keccak256(ring + messageDigest + String(modulo(mult(alpha, G), P))),
      ),
    );

    // compute Cpi+2 to Cn
    for (let i = pi + 2; i < ring.length; i++) {
      cValuesPI1N.push(
        BigInt(
          "0x" +
            keccak256(
              ring +
                messageDigest +
                String(
                  modulo(
                    add(
                      responses[i - 1],
                      mult(cValuesPI1N[i - pi - 2], ring[i - 1]),
                    ),
                    P,
                  ),
                ),
            ),
        ),
      );
    }

    // supposed to contains all the c from 0 to pi
    const cValues0PI: bigint[] = [];

    // compute C0
    cValues0PI.push(
      BigInt(
        "0x" +
          keccak256(
            ring +
              messageDigest +
              String(
                modulo(
                  add(
                    responses[responses.length - 1],
                    mult(
                      cValuesPI1N[cValuesPI1N.length - 1],
                      ring[ring.length - 1],
                    ),
                  ),
                  P,
                ),
              ),
          ),
      ),
    );

    // compute C0 to C pi -1
    for (let i = 1; i < pi + 1; i++) {
      cValues0PI[i] = BigInt(
        "0x" +
          keccak256(
            ring +
              messageDigest +
              String(
                modulo(
                  add(responses[i - 1], mult(cValues0PI[i - 1], ring[i - 1])),
                  P,
                ),
              ),
          ),
      );
    }

    // concatenate CValues0PI, cpi and CValuesPI1N to get all the c values
    const cees: bigint[] = cValues0PI.concat(cValuesPI1N);

    // compute the signer response
    const signerResponse = piSignature(alpha, cees[pi], signerPrivKey, curve);

    return new RingSignature(
      message,
      ring,
      cees[0],
      // insert the signer response
      responses.slice(0, pi).concat([signerResponse], responses.slice(pi + 1)),
      curve,
    );
  }

  /**
   * Sign a message using ring signatures
   *
   * @param ring - Ring of public keys (does not contain the signer public key)
   * @param message - Clear message to sign
   * @param signerPubKey - Public key of the signer
   *
   * @returns A PartialSignature
   */
  static partialSign(
    ring: [[bigint, bigint]], // ring.length = n
    message: string,
    signerPubKey: [bigint, bigint],
    curve = Curve.SECP256K1,
  ): PartialSignature {
    let P: bigint; // order of the curve
    let G: [bigint, bigint]; // generator point

    switch (curve) {
      case Curve.SECP256K1:
        P = SECP256K1.P;
        G = SECP256K1.G;
        break;
      case Curve.ED25519:
        throw new Error("ED25519 signing is not implemented yet");
      default:
        throw new Error("unknown curve");
    }

    // hash the message
    const messageDigest = keccak256(message);

    // generate random number alpha
    const alpha = randomBigint(P);

    // set the signer position in the ring
    if (curve !== Curve.SECP256K1) throw new Error("Curve not supported");

    const pi = getRandomSecuredNumber(0, ring.length - 1); // signer index
    // add the signer public key to the ring
    ring = ring.slice(0, pi).concat([signerPubKey], ring.slice(pi)) as [
      [bigint, bigint],
    ];

    // check for duplicates
    for (let i = 0; i < ring.length; i++) {
      // complexity.. :(
      for (let j = i + 1; j < ring.length; j++) {
        if (ring[i][0] === ring[j][0] && ring[i][1] === ring[j][1]) {
          throw new Error("Ring contains duplicate public keys");
        }
      }
    }

    // generate random fake responses for everybody
    const responses: [bigint, bigint][] = [];
    for (let i = 0; i < ring.length; i++) {
      responses.push(mult(randomBigint(P), G));
    }

    // supposed to contains all the cees from pi+1 to n (pi+1, pi+2, ..., n)(n = ring.length)
    const cValuesPI1N: bigint[] = [];

    // compute C pi+1
    cValuesPI1N.push(
      BigInt(
        "0x" +
          keccak256(ring + messageDigest + String(modulo(mult(alpha, G), P))),
      ),
    );

    // compute Cpi+2 to Cn
    for (let i = pi + 2; i < ring.length; i++) {
      cValuesPI1N.push(
        BigInt(
          "0x" +
            keccak256(
              ring +
                messageDigest +
                String(
                  modulo(
                    add(
                      responses[i - 1],
                      mult(cValuesPI1N[i - pi - 2], ring[i - 1]),
                    ),
                    P,
                  ),
                ),
            ),
        ),
      );
    }

    // supposed to contains all the c from 0 to pi
    const cValues0PI: bigint[] = [];

    // compute C0
    cValues0PI.push(
      BigInt(
        "0x" +
          keccak256(
            ring +
              messageDigest +
              String(
                modulo(
                  add(
                    responses[responses.length - 1],
                    mult(
                      cValuesPI1N[cValuesPI1N.length - 1],
                      ring[ring.length - 1],
                    ),
                  ),
                  P,
                ),
              ),
          ),
      ),
    );

    // compute C0 to C pi -1
    for (let i = 1; i < pi + 1; i++) {
      cValues0PI[i] = BigInt(
        "0x" +
          keccak256(
            ring +
              messageDigest +
              String(
                modulo(
                  add(responses[i - 1], mult(cValues0PI[i - 1], ring[i - 1])),
                  P,
                ),
              ),
          ),
      );
    }

    // concatenate CValues0PI, cpi and CValuesPI1N to get all the c values
    const cees: bigint[] = cValues0PI.concat(cValuesPI1N);

    return {
      message: message,
      ring: ring,
      cees: cees,
      alpha: alpha,
      signerIndex: pi,
      responses_0_pi: responses.slice(0, pi) as [bigint, bigint][],
      responses_pi_n: responses.slice(pi + 1, responses.length) as [
        bigint,
        bigint,
      ][],
      curve: curve,
    } as PartialSignature;
  }

  /**
   * Combine partial signatures into a RingSignature
   *
   * @param partialSig - Partial signatures to combine
   * @param signerResponse - Response of the signer
   *
   * @returns A RingSignature
   */
  static combine(
    partialSig: PartialSignature,
    signerResponse: [bigint, bigint],
  ): RingSignature {
    return new RingSignature(
      partialSig.message,
      partialSig.ring,
      partialSig.cees[0],
      partialSig.responses_0_pi.concat(
        [signerResponse],
        partialSig.responses_pi_n,
      ),
      partialSig.curve,
    );
  }

  /**
   * Verify a RingSignature
   *
   * @returns True if the signature is valid, false otherwise
   */
  verify(): boolean {
    // we compute c1' = Hash(Ring, m, [r0G, c0K0])
    // then, for each ci (i > 1), compute ci' = Hash(Ring, message, [riG + ciKi])
    // (G = generator, K = ring public key)
    // finally, if we substitute lastC for lastC' and c0' == c0, the signature is valid

    if (this.ring.length !== this.responses.length) {
      throw new Error("ring and responses length mismatch");
    }

    let P: bigint; // order of the curve

    switch (this.curve) {
      case Curve.SECP256K1: {
        P = SECP256K1.P;
        break;
      }
      case Curve.ED25519: {
        throw new Error(
          "ED25519 signature verification is not implemented yet",
        );
      }
      default: {
        throw new Error("unknown curve");
      }
    }

    if (this.ring.length > 1) {
      // hash the message
      const messageDigest = keccak256(this.message);

      // computes the cees
      let lastComputedCp = BigInt(
        "0x" +
          keccak256(
            this.ring +
              messageDigest +
              String(
                modulo(add(this.responses[0], mult(this.c, this.ring[0])), P),
              ),
          ),
      );

      for (let i = 2; i < this.ring.length; i++) {
        lastComputedCp = BigInt(
          "0x" +
            keccak256(
              this.ring +
                messageDigest +
                String(
                  modulo(
                    add(
                      this.responses[i - 1],
                      mult(lastComputedCp, this.ring[i - 1]),
                    ),
                    P,
                  ),
                ),
            ),
        );
      }

      // return true if c0 === c0'
      return (
        this.c ===
        BigInt(
          "0x" +
            keccak256(
              this.ring +
                messageDigest +
                String(
                  modulo(
                    add(
                      this.responses[this.responses.length - 1],
                      mult(lastComputedCp, this.ring[this.ring.length - 1]),
                    ),
                    P,
                  ),
                ),
            ),
        )
      );
    }
    return false;
  }

  static verify(signature: RingSig): boolean {
    const ringSignature: RingSignature = RingSignature.fromRingSig(signature);
    return ringSignature.verify();
  }
}
