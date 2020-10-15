import keccak from "keccak";

export interface IHasher {
    compute(message: Buffer): Buffer;
}

export class KeccakHasher implements IHasher {
    compute(inputBuffer: Buffer): Buffer {
       return keccak("keccak256").update(inputBuffer).digest();
    }
}

export class Blake2BHasher implements IHasher {
    private readonly hasher = require('blake2b');

    compute(inputBuffer: Buffer): Buffer {
       return this.hasher(64).update(inputBuffer).digest();
    }
}
