class Serialisers {


    public static readInt32 (data: Uint8Array, start: number, littleEndian: boolean = false): number {
        // console.log(new DataView(data.buffer.slice(start, start + 4)).getInt32(0));
        return new DataView(data.buffer).getInt32(start, littleEndian);
    }


    public static readUint32 (data: Uint8Array, start: number, littleEndian: boolean = false): number {
        // console.log(data.buffer.slice(start, start + 4));
        // console.log(new DataView(data.buffer).getUint32(start, littleEndian));
        return new DataView(data.buffer).getUint32(start, littleEndian);
    }


    public static readUint16 (data: Uint8Array, start: number, littleEndian: boolean = false): number {
        return new DataView(data.buffer).getUint16(start, littleEndian);
    }

}
