import { Curve, Point } from ".";
import { SignatureConfig } from "./interfaces";
/**
 * Ring signature class.
 * This class is used to sign messages using ring signatures.
 * It can also be used to verify ring signatures.
 */
export declare class RingSignature {
    private message;
    private c;
    private responses;
    private ring;
    private curve;
    private config?;
    /**
     * Ring signature class constructor
     *
     * @param message - Clear message to sign
     * @param ring - Ring of public keys
     * @param c - c value
     * @param responses - Responses for each public key in the ring
     * @param curve - Curve used for the signature
     * @param config - The config params to use (optional)
     */
    constructor(message: string, ring: Point[], c: bigint, responses: bigint[], curve: Curve, config?: SignatureConfig);
    /**
     * Get the Ring
     *
     * @returns The Ring
     */
    getRing(): Point[];
    /**
     * Get the challenge value
     *
     * @returns The challenge value
     */
    getChallenge(): bigint;
    /**
     * Get the responses
     *
     * @returns The responses
     */
    getResponses(): bigint[];
    /**
     * Get the curve
     *
     * @returns The curve
     */
    getCurve(): Curve;
    /**
     * Get the config
     *
     * @returns The config
     */
    getConfig(): SignatureConfig | undefined;
    /**
     * Get the message
     *
     * @returns The message
     */
    getMessage(): string;
    /**
     * Get the message digest
     *
     * @returns The message digest
     */
    get messageDigest(): bigint;
    /**
     * Create a RingSignature from a json object
     *
     * @remarks
     * message can be stored in the json as string or number. Not array or object
     *
     * @param json - The json to convert
     *
     * @returns A RingSignature
     */
    static fromJsonString(json: string | object): RingSignature;
    /**
     * Create a Json string from a RingSignature
     *
     * @returns A json string
     */
    toJsonString(): string;
    /**
     * Transforms a Base64 string to a ring signature
     *
     * @param base64 - The base64 encoded signature
     *
     * @returns The ring signature
     */
    static fromBase64(base64: string): RingSignature;
    /**
     * Encode a ring signature to base64 string
     */
    toBase64(): string;
    /**
     * Sign a message using ring signatures
     *
     * @param ring - Ring of public keys (does not contain the signer public key)
     * @param signerPrivKey - Private key of the signer
     * @param message - Clear message to sign
     * @param curve - The elliptic curve to use
     * @param config - The config params to use
     *
     * @returns A RingSignature
     */
    static sign(ring: Point[], // ring.length = n
    signerPrivateKey: bigint, message: string, curve: Curve, config?: SignatureConfig): RingSignature;
    /**
     * Verify a RingSignature
     *
     * @remarks
     * if ring.length = 1, the signature is a schnorr signature. It can be verified by this method or using 'verifySchnorrSignature' function.
     * To do so, call 'verifySchnorrSignature' with the following parameters:
     * - messageDigest: the message digest
     * - signerPubKey: the public key of the signer
     * - signature: the signature { c, r }
     * - curve: the curve used for the signature
     * - config: the config params used for the signature (can be undefined)
     * - keyPrefixing: true
     *
     * @returns True if the signature is valid, false otherwise
     */
    verify(): boolean;
    /**
     * Verify a RingSignature stored as a base64 string or a json string
     *
     * @param signature - The json or base64 encoded signature to verify
     * @returns True if the signature is valid, false otherwise
     */
    static verify(signature: string): boolean;
    /**
     * Generate an incomplete ring signature.
     *
     * @param curve - The curve to use
     * @param ring - The ring of public keys
     * @param ceePiPlusOne - The Cpi+1 value
     * @param signerIndex - The signer index in the ring
     * @param messageDigest - The message digest
     * @param config - The config params to use
     *
     * @returns An incomplete ring signature
     */
    private static signature;
    /**
     * Compute a c value
     *
     * @remarks
     * Either 'alpha' or all the other keys of 'params' must be set.
     *
     * @param ring - Ring of public keys
     * @param message - Message digest
     * @param G - Curve generator point
     * @param N - Curve order
     * @param params - The params to use
     * @param config - The config params to use
     *
     * @see params.index - The index of the public key in the ring
     * @see params.previousR - The previous response which will be used to compute the new c value
     * @see params.previousC - The previous c value which will be used to compute the new c value
     * @see params.previousPubKey - The previous public key which will be used to compute the new c value
     * @see params.alpha - The alpha value which will be used to compute the new c value
     *
     * @returns A new c value
     */
    private static computeC;
}
/**
 * Check if a ring is valid
 *
 * @param ring - The ring to check
 * @param ref - The curve to use as a reference (optional, if not set, the first point's curve will be used)
 * @param emptyRing - If true, the ring can be empty
 *
 * @throws Error if the ring is empty
 * @throws Error if the ring contains duplicates
 * @throws Error if at least one of the points is invalid
 */
export declare function checkRing(ring: Point[], ref?: Curve, emptyRing?: boolean): void;
/**
 * Serialize a ring, i.e., serialize each point in the ring
 *
 * @param ring - The ring to serialize
 *
 * @returns The serialized ring as a string array
 */
export declare function serializeRing(ring: Point[]): bigint[];
/**
 * Check if a point is valid
 *
 * @param point - The point to check
 * @param curve - The curve to use as a reference
 *
 * @throws Error if the point is not on the reference curve
 * @throws Error if at least 1 coordinate is not valid (= 0 or >= curve order)
 */
export declare function checkPoint(point: Point, curve?: Curve): void;
/**
 * Sort a ring by x ascending coordinate (and y ascending if x's are equal)
 *
 * @param ring the ring to sort
 * @returns the sorted ring
 */
export declare function sortRing(ring: Point[]): Point[];
export declare function publicKeyToBigInt(publicKeyHex: string): bigint;
export declare function bigIntToPublicKey(bigint: bigint): string;
