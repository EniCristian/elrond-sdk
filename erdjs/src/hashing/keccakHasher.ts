import { Hasher } from "./hasher";
import keccak from "keccak";

export class KeccakHasher extends Hasher {
    getComputedValue(inputBuffer: Buffer): Buffer {
       return keccak("keccak256").update(inputBuffer).digest();
    }
}
