export declare const $callbacksList: {
    readonly properties: {
        readonly data: {
            readonly type: "array";
            readonly contains: {
                readonly type: "callbackObject";
            };
        };
        readonly count: {
            readonly type: "number";
            readonly maximum: 1000000;
        };
        readonly page: {
            readonly type: "number";
            readonly maximum: 10000;
        };
        readonly pageSize: {
            readonly type: "number";
            readonly maximum: 500;
        };
        readonly orderBy: {
            readonly type: "string";
            readonly maxLength: 500;
            readonly pattern: "(.*?)";
        };
        readonly asc: {
            readonly type: "number";
        };
    };
};
//# sourceMappingURL=$callbacksList.d.ts.map