export interface IHasher {
    compute(message: string): Buffer;
}

export abstract class Hasher implements Hasher {
    public compute(message: string): Buffer {
        var input = Buffer.from(message)
        return this.getComputedValue(input);
    }

    protected abstract getComputedValue(inputBuffer: Buffer): Buffer;
}
