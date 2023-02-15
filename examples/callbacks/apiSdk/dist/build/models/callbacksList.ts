/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { callbackObject } from './callbackObject';

export type callbacksList = {
    data?: Array<callbackObject>;
    count?: number;
    page?: number;
    pageSize?: number;
    orderBy?: string;
    asc?: number;
};
