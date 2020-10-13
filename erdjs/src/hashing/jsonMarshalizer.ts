import { IMarshalizer } from "./marshalizer";

export class JsonMarshalizer implements IMarshalizer {
    marshalize(object: any): string {
        return JSON.stringify(object);
    }
}