import { keccak256 } from "js-sha3";
import { SECP256K1, Point, randomBigint, Curve } from "../src/utils";
import { piSignature } from "../src";

const P = SECP256K1.P;
const G = new Point(Curve.SECP256K1, SECP256K1.G);

// ring pubkeys
const K1 = G.mult(randomBigint(P));

const K3 = G.mult(randomBigint(P));

// signer keys
const k2 = randomBigint(P);
const K2 = G.mult(k2);

/* -------SIGNING------- */

// alpha
const alpha = randomBigint(P);

// fake responses
const r1 = new Point(Curve.SECP256K1, [randomBigint(P), randomBigint(P)]);
const r3 = new Point(Curve.SECP256K1, [randomBigint(P), randomBigint(P)]);

// pi = 2
const ring = [K1, K2, K3];
// console.log('ring: ', ring);
const message = keccak256("test");
// console.log("alpha: ", alpha);

// seed the loop
const c3 = BigInt(
  "0x" + keccak256(ring + message + G.mult(alpha).modulo(P).toString()),
);
console.log("c3: \n", G.mult(alpha), "\n");

// Iterate:
const c1 = BigInt(
  "0x" + keccak256(ring + message + r3.add(K3.mult(c3)).modulo(P).toString()),
);

const c2 = BigInt(
  "0x" + keccak256(ring + message + r1.add(K1.mult(c1)).modulo(P).toString()),
);

// signer response
const r2 = piSignature(alpha, c2, k2, Curve.SECP256K1);

// this shouldn't change the value of c3
// c3 = BigInt('0x' + keccak256(
//   ring
//   + message
//   + String(modulo(r2 * G[0], P) + modulo(c2 * K2[0], P))
//   + String(modulo(r2 * G[1], P) + modulo(c2 * K2[1], P))
// ));

/* -------VERIFICATION------- */

const c2p = BigInt(
  "0x" + keccak256(ring + message + r1.add(K1.mult(c1)).modulo(P).toString()),
);

// c2 should be equal to c2p
console.log("c2 === c2p: ", c2 === c2p);

const c3p = BigInt(
  "0x" + keccak256(ring + message + r2.add(K2.mult(c2p)).modulo(P).toString()),
);

// c3 should be equal to c3p
console.log("c3 === c3p: ", c3 === c3p);

const c1p = BigInt(
  "0x" + keccak256(ring + message + r3.add(K3.mult(c3p)).modulo(P).toString()),
);

console.log("c1: ", c1);
console.log("c2: ", c2);
console.log("c3: ", c3);
console.log("\n");
console.log("c1p: ", c1p);
console.log("c2p: ", c2p);
console.log("c3p: ", c3p);
console.log("\n");

// c1 should be equal to c1p
console.log("c1 === c1p: ", c1 === c1p);

if (c1 === c1p) {
  console.log("Example signature is valid");
}
