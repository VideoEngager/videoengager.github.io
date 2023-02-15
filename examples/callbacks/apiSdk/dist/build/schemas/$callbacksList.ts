/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $callbacksList = {
    properties: {
        data: {
    type: 'array',
    contains: {
        type: 'callbackObject',
    },
},
        count: {
    type: 'number',
    maximum: 1000000,
},
        page: {
    type: 'number',
    maximum: 10000,
},
        pageSize: {
    type: 'number',
    maximum: 500,
},
        orderBy: {
    type: 'string',
    maxLength: 500,
    pattern: '(.*?)',
},
        asc: {
    type: 'number',
},
    },
} as const;
