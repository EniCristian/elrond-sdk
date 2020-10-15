import { TxMessage } from "../proto";
import { ProtoToObjectOptions } from "../shared";
import * as errors from "../errors";

export interface IMarshalizer<T> {
    marshalize(object: any): Buffer;
    unmarshalize(serializedObject: Buffer): T;
}

export class ProtoMarhalizer<T> implements IMarshalizer<T> {
    private readonly type: protobuf.Type
    constructor(type: protobuf.Type) {
        this.type=type;
    }
    unmarshalize(buffer: Buffer): T {
        var message: any;
        try {
            message = this.type.decode(buffer);
        } catch (error) {
            throw new errors.ErrBadType(this.type.name, this.type, buffer);
        }
        let object = TxMessage.toObject(message, ProtoToObjectOptions);

        return object as T;
    }

    marshalize(transaction: T): Buffer {
        var obj: Uint8Array;
        
        try {
            obj = this.type.encode(transaction).finish();
        } catch (error) {
            throw new errors.ErrBadType(this.type.name, this.type, transaction);
        }
       
        return this.toBuffer(obj.buffer);
    }
    
    private  toBuffer(arrayBuffer:ArrayBufferLike) {
        var buffer = Buffer.alloc(arrayBuffer.byteLength);
        var view = new Uint8Array(arrayBuffer);
        for (var i = 0; i < buffer.length; ++i) {
            buffer[i] = view[i];
        }
        return buffer;
    }
}
