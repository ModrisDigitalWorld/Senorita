import { z } from "zod";
export declare const RequestUploadUrlBody: z.ZodObject<{
    name: z.ZodString;
    size: z.ZodNumber;
    contentType: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    size: number;
    contentType: string;
}, {
    name: string;
    size: number;
    contentType: string;
}>;
export declare const RequestUploadUrlResponse: z.ZodObject<{
    uploadURL: z.ZodString;
    objectPath: z.ZodString;
    metadata: z.ZodObject<{
        name: z.ZodString;
        size: z.ZodNumber;
        contentType: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        size: number;
        contentType: string;
    }, {
        name: string;
        size: number;
        contentType: string;
    }>;
}, "strip", z.ZodTypeAny, {
    uploadURL: string;
    objectPath: string;
    metadata: {
        name: string;
        size: number;
        contentType: string;
    };
}, {
    uploadURL: string;
    objectPath: string;
    metadata: {
        name: string;
        size: number;
        contentType: string;
    };
}>;
//# sourceMappingURL=storage.d.ts.map