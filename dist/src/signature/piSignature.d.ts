import { Point } from "../point";
import { Curve } from "../curves";
/**
 * Compute the signature from the actual signer
 *
 * @remarks
 * This function is used to compute the signature of the actual signer in a ring signature scheme.
 * It is really close to a schnorr signature.
 *
 * @param alpha - the alpha value
 * @param c - the seed
 * @param signerPrivKey - the private key of the signer
 * @param Curve - the curve to use
 *
 * @returns the signer response as a point on the curve
 */
export declare function piSignature(alpha: bigint, c: bigint, signerPrivKey: bigint, curve: Curve): bigint;
/**
 * Verify a signature generated with the `piSignature` function
 *
 * @param alpha - The alpha value
 * @param signerPubKey - The signer public key
 * @param c - The challenge
 * @param piSignature - The signature
 * @param curve - The curve to use
 * @param config - The signature config
 *
 * @returns true if the signature is valid, false otherwise
 */
export declare function verifyPiSignature(alpha: bigint, signerPubKey: Point, c: bigint, piSignature: bigint, curve: Curve): boolean;
