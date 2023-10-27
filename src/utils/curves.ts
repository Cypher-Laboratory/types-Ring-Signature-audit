import { ExtendedPoint, Gx, Gy, mod } from "./noble-libraries/noble-ED25519";
import { Point } from "./point";
import * as ed from "./noble-libraries/noble-ED25519";

/**
 * List of supported curves
 */
export enum CurveName {
  SECP256K1 = "SECP256K1",
  ED25519 = "ED25519",
  CUSTOM = "CUSTOM",
}

export class Curve {
  name: CurveName; // curve name
  N: bigint; // curve order
  G: [bigint, bigint]; // generator point
  P: bigint; // field size

  /**
   * Creates a curve instance.
   *
   * @param curve - The curve name
   * @param params - The curve parameters (optional if curve is SECP256K1 or ED25519)
   */
  constructor(
    curve: CurveName,
    params?: { P: bigint; G: [bigint, bigint]; N: bigint },
  ) {
    this.name = curve;

    switch (this.name) {
      case CurveName.SECP256K1:
        this.G = SECP256K1.G;
        this.N = SECP256K1.N;
        this.P = SECP256K1.P;
        break;
      case CurveName.ED25519:
        this.G = ED25519.G;
        this.N = ED25519.N;
        this.P = ED25519.P;
        break;
      default:
        if (params) {
          this.G = params.G;
          this.N = params.N;
          this.P = params.P;
          break;
        }
        throw new Error("Invalid params");
    }
  }

  /**
   * Returns the generator point as a Point instance.
   *
   * @returns the generator point
   */
  GtoPoint(): Point {
    return new Point(this, this.G);
  }

  /**
   * Returns the curve as a json string.
   */
  toString(): string {
    return JSON.stringify({
      curve: this.name,
      Gx: this.G[0].toString(),
      Gy: this.G[1].toString(),
      N: this.N.toString(),
      P: this.P.toString(),
    });
  }

  /**
   * Returns a curve instance from a json string.
   *
   * @param curveData - the curve as a json string
   * @returns the curve instance
   */
  static fromString(curveData: string): Curve {
    const data = JSON.parse(curveData) as {
      curve: CurveName;
      Gx: string;
      Gy: string;
      N: string;
      P: string;
    };
    const G = [BigInt(data.Gx), BigInt(data.Gy)] as [bigint, bigint];
    const N = BigInt(data.N);
    const P = BigInt(data.P);
    return new Curve(data.curve, { P, G, N });
  }
}

// SECP256K1 curve constants
const SECP256K1 = {
  P: 2n ** 256n - 2n ** 32n - 977n,
  N: 2n ** 256n - 0x14551231950b75fc4402da1732fc9bebfn,
  G: [
    55066263022277343669578718895168534326250603453777594175500187360389116729240n,
    32670510020758816978083085130507043184471273380659243275938904335757337482424n,
  ] as [bigint, bigint],
};

// ED25519 curve constants
const G = new ExtendedPoint(Gx, Gy, 1n, mod(Gx * Gy));
const ED25519 = {
  P: 2n ** 255n - 19n,
  N: 2n ** 252n + 27742317777372353535851937790883648493n, // curve's (group) order
  G: [G.toAffine().x, G.toAffine().y] as [bigint, bigint],
};

/**
 * List of supported configs for the `derivePubKey` function
 * This configs are used to specify if a specific way to derive the public key is used. (such as for xrpl keys)
 */
export enum Config {
  DEFAULT = "DEFAULT", // derive the public key from the private key: pubKey = G * privKey
  XRPL = "XRPL",
}

/**
 * Derive the public key from the private key.
 *
 * @param privateKey - the private key
 * @param curve - the curve to use
 * @param config - the config to use (optional)
 * @returns
 */
export function derivePubKey(
  privateKey: bigint,
  curve: Curve,
  config?: Config,
): Point {
  if (!config) config = Config.DEFAULT;
  switch (config) {
    case Config.DEFAULT: {
      return curve.GtoPoint().mult(privateKey);
    }
    case Config.XRPL: {
      if (curve.name !== CurveName.ED25519)
        throw new Error(
          "XRPL config can only be used with ED25519 curve for now",
        );
      console.log("privateKey: ", privateKey.toString(16));
      const extendedPublicKey = ed.utils.getExtendedPublicKey(
        privateKey.toString(16),
      );
      return curve.GtoPoint().mult(extendedPublicKey.scalar);
    }
    default: {
      console.warn(
        "Unknown derivation Config. Using PublicKey = G * privateKey",
      );
      return curve.GtoPoint().mult(privateKey);
    }
  }
}
