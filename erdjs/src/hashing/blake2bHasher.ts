import { Hasher } from "./hasher";

export class Blake2BHasher extends Hasher {
    private readonly hasher = require('blake2b');

    getComputedValue(inputBuffer: Buffer): Buffer {
       return this.hasher(64).update(inputBuffer).digest();
    }
}
