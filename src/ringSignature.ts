import { keccak256 } from "js-sha3";
import { G, P, randomBigint, getRandomSecuredNumber } from "./utils";
import { piSignature } from "./signature/piSignature";

/**
 * Ring signature interface
 *
 * @see message - Clear message
 * @see ring - Ring of public keys
 * @see cees - c values
 * @see responses - Responses for each public key in the ring
 */
export interface RingSig {
  message: string; // clear message
  ring: [[bigint, bigint]];
  cees: bigint[];
  responses: bigint[];
}

/**
 * Partial ring signature interface
 *
 * @see message - Clear message
 * @see ring - Ring of public keys
 * @see cees - c values
 * @see fakeResponses_0_pi - Fake responses from 0 to pi-1
 * @see fakeResponses_pi_n - Fake responses from pi+1 to n
 */
export interface PartialSignature {
  message: string;
  ring: [[bigint, bigint]];
  cees: bigint[];
  alpha: bigint;
  signerIndex: number;
  fakeResponses_0_pi: bigint[];
  fakeResponses_pi_n: bigint[];
}

export class RingSignature {
  message: string; // clear message
  cees: bigint[];
  responses: bigint[];
  ring: [[bigint, bigint]];

  /**
   * Ring signature class constructor
   *
   * @param message - Clear message to sign
   * @param ring - Ring of public keys
   * @param cees - c values
   * @param responses - Responses for each public key in the ring
   */
  constructor(
    message: string,
    ring: [[bigint, bigint]],
    cees: bigint[],
    responses: bigint[],
  ) {
    this.ring = ring;
    this.message = message;
    this.cees = cees;
    this.responses = responses;
  }

  /**
   * Create a RingSignature from a RingSig
   *
   * @param sig - The RingSig to convert
   *
   * @returns A RingSignature
   */
  static fromRingSig(sig: RingSig): RingSignature {
    return new RingSignature(sig.message, sig.ring, sig.cees, sig.responses);
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
      cees: this.cees,
      responses: this.responses,
    };
  }

  /**
   * Sign a message using ring signatures
   *
   * @param ring - Ring of public keys
   * @param signerPrivKey - Private key of the signer
   * @param message - Clear message to sign
   *
   * @returns A RingSignature
   */
  static sign(
    ring: [[bigint, bigint]], // ring.length = n
    signerPrivKey: bigint,
    message: string,
  ): RingSignature {
    // generate random number alpha
    const alpha = randomBigint(P);
    const pi = getRandomSecuredNumber(0, ring.length - 1); // signer index

    // generate random fake responses for everybody except the signer
    const fakeResponses: bigint[] = [];
    for (let i = 0; i < ring.length; i++) {
      fakeResponses.push(randomBigint(P));
    }

    // supposed to contains all the cees from pi+1 to n (pi+1, pi+2, ..., n)(n = ring.length)
    const cValuesPI1N: bigint[] = [];

    // compute C pi+1
    cValuesPI1N.push(
      BigInt(
        "0x" +
          keccak256(
            ring + message + String(alpha * G[0]) + String(alpha * G[1]),
          ),
      ),
    );

    // compute C pi+2 to C n
    for (let i = pi + 2; i < ring.length; i++) {
      cValuesPI1N.push(
        BigInt(
          "0x" +
            keccak256(
              ring +
                message +
                String(
                  fakeResponses[i] * G[0] +
                    BigInt("0x" + cValuesPI1N[i - pi - 2]) * ring[i][0] +
                    BigInt("0x" + cValuesPI1N[i - pi - 2]) * ring[i][1] +
                    fakeResponses[i] * G[1],
                ),
            ),
        ),
      );
    }

    // supposed to contains all the c from 0 to pi
    const cValues0PI: bigint[] = [];

    // compute C 0
    cValues0PI.push(
      BigInt(
        "0x" +
          keccak256(
            ring +
              message +
              String(
                fakeResponses[ring.length - 1] * G[0] +
                  BigInt("0x" + cValuesPI1N[cValuesPI1N.length - 1]) *
                    ring[ring.length - 1][0] +
                  BigInt("0x" + cValuesPI1N[cValuesPI1N.length - 1]) *
                    ring[ring.length - 1][1] +
                  fakeResponses[ring.length - 1] * G[1],
              ),
          ),
      ),
    );

    // compute C 1 to C pi -1
    for (let i = 1; i < pi + 1; i++) {
      cValues0PI[i] = BigInt(
        "0x" +
          keccak256(
            ring +
              message +
              String(
                fakeResponses[i] * G[0] +
                  BigInt("0x" + cValues0PI[i - 1]) * ring[i][0] +
                  BigInt("0x" + cValues0PI[i - 1]) * ring[i][1] +
                  fakeResponses[i] * G[1],
              ),
          ),
      );
    }

    // concatenate CValues0PI, cpi and CValuesPI1N to get all the c values
    const cees: bigint[] = cValues0PI.concat(cValuesPI1N);

    // compute the signer response
    const signerResponse = piSignature(alpha, cees[pi], signerPrivKey, P);

    return new RingSignature(
      message,
      ring,
      cees,
      // concatenate all the fake responses with the signer response (respecting the order)
      fakeResponses
        .slice(0, pi)
        .concat([signerResponse])
        .concat(fakeResponses.slice(pi, fakeResponses.length)),
    );
  }

  /**
   * Sign a message using ring signatures
   *
   * @param ring - Ring of public keys
   * @param message - Clear message to sign
   *
   * @returns A PartialSignature
   */
  static partialSign(
    ring: [[bigint, bigint]], // ring.length = n
    message: string,
  ): PartialSignature {
    // generate random number alpha
    const alpha = randomBigint(P);
    const pi = getRandomSecuredNumber(0, ring.length - 1); // signer index

    // generate random fake responses for everybody except the signer
    const fakeResponses: bigint[] = [];
    for (let i = 0; i < ring.length; i++) {
      fakeResponses.push(randomBigint(P));
    }

    // supposed to contains all the cees from pi+1 to n (pi+1, pi+2, ..., n)(n = ring.length)
    const cValuesPI1N: bigint[] = [];

    // compute C pi+1
    cValuesPI1N.push(
      BigInt(
        "0x" +
          keccak256(
            ring + message + String(alpha * G[0]) + String(alpha * G[1]),
          ),
      ),
    );

    // compute C pi+2 to C n
    for (let i = pi + 2; i < ring.length; i++) {
      cValuesPI1N.push(
        BigInt(
          "0x" +
            keccak256(
              ring +
                message +
                String(
                  fakeResponses[i] * G[0] +
                    BigInt("0x" + cValuesPI1N[i - pi - 2]) * ring[i][0] +
                    BigInt("0x" + cValuesPI1N[i - pi - 2]) * ring[i][1] +
                    fakeResponses[i] * G[1],
                ),
            ),
        ),
      );
    }

    // supposed to contains all the c from 0 to pi
    const cValues0PI: bigint[] = [];

    // compute C 0
    cValues0PI.push(
      BigInt(
        "0x" +
          keccak256(
            ring +
              message +
              String(
                fakeResponses[ring.length - 1] * G[0] +
                  BigInt("0x" + cValuesPI1N[cValuesPI1N.length - 1]) *
                    ring[ring.length - 1][0] +
                  BigInt("0x" + cValuesPI1N[cValuesPI1N.length - 1]) *
                    ring[ring.length - 1][1] +
                  fakeResponses[ring.length - 1] * G[1],
              ),
          ),
      ),
    );

    // compute C 1 to C pi -1
    for (let i = 1; i < pi + 1; i++) {
      cValues0PI[i] = BigInt(
        "0x" +
          keccak256(
            ring +
              message +
              String(
                fakeResponses[i] * G[0] +
                  BigInt("0x" + cValues0PI[i - 1]) * ring[i][0] +
                  BigInt("0x" + cValues0PI[i - 1]) * ring[i][1] +
                  fakeResponses[i] * G[1],
              ),
          ),
      );
    }

    // concatenate cValues0PI and CValuesPI1N to get all the c values
    const cees: bigint[] = cValues0PI.concat(cValuesPI1N);

    return {
      message: message,
      ring: ring,
      cees: cees,
      alpha: alpha,
      signerIndex: pi,
      fakeResponses_0_pi: fakeResponses.slice(0, pi),
      fakeResponses_pi_n: fakeResponses.slice(pi, fakeResponses.length),
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
    signerResponse: bigint,
  ): RingSignature {
    return new RingSignature(
      partialSig.message,
      partialSig.ring,
      partialSig.cees,
      partialSig.fakeResponses_0_pi.concat(
        signerResponse,
        partialSig.fakeResponses_pi_n,
      ),
    );
  }

  /**
   * Verify a RingSignature
   *
   * @returns True if the signature is valid, false otherwise
   */
  verify() {
    // compare c1 with the computed c'1 = keccak256(ring, message, rn*Gx + rn*Gy + cn*Kx + cn*Ky)
    // (G = generator, K = ring public key)
    return (
      BigInt(
        "0x" +
          keccak256(
            this.ring +
              this.message +
              String(
                this.responses[this.responses.length - 1] * G[0] +
                  BigInt("0x" + this.cees[this.cees.length - 1]) *
                    this.ring[this.ring.length - 1][0] +
                  BigInt("0x" + this.cees[this.cees.length - 1]) *
                    this.ring[this.ring.length - 1][1] +
                  this.responses[this.responses.length - 1] * G[1],
              ),
          ),
      ) === this.cees[0]
    );
  }
}
