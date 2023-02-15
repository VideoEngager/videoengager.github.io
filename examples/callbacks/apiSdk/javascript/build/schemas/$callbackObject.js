/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $callbackObject = {
    properties: {
        genesys: {
            properties: {
                conversation: {
                    properties: {
                        id: {
                            type: 'string',
                            isRequired: true,
                            maxLength: 500,
                            pattern: '(.*?)',
                        },
                    },
                },
            },
        },
        videoengager: {
            properties: {
                autoAnswer: {
                    type: 'boolean',
                    isRequired: true,
                },
                name: {
                    type: 'string',
                    description: `visitor Name`,
                    isRequired: true,
                    maxLength: 500,
                    pattern: '(.*?)',
                },
                email: {
                    type: 'string',
                    description: `visitor Email`,
                    isRequired: true,
                    maxLength: 150,
                    pattern: '(.*?)',
                },
                phone: {
                    type: 'string',
                    description: `visitor Phone`,
                    isRequired: true,
                    maxLength: 500,
                    pattern: '(.*?)',
                },
                subject: {
                    type: 'string',
                    description: `subject`,
                    isRequired: true,
                    maxLength: 500,
                    pattern: '(.*?)',
                },
                meetingUrl: {
                    type: 'string',
                    description: `Visitor Join Meeting URL`,
                    isRequired: true,
                    maxLength: 500,
                    pattern: '(.*?)',
                },
                code: {
                    type: 'string',
                    description: `Short URL Code for generating short URL`,
                    isRequired: true,
                    maxLength: 500,
                    pattern: '(.*?)',
                },
                date: {
                    type: 'number',
                    description: `scheduled Time`,
                    isRequired: true,
                    format: 'int64',
                },
                agentUrl: {
                    type: 'string',
                    description: `Agent Meeting URL, Only Available upon creation`,
                    maxLength: 500,
                    pattern: '(.*?)',
                },
                created: {
                    type: 'string',
                    description: `Created At`,
                    isRequired: true,
                    maxLength: 500,
                    pattern: '(.*?)',
                },
                duration: {
                    type: 'number',
                    description: `Duration of callback in minutes`,
                    isRequired: true,
                    format: 'int64',
                },
                scheduleId: {
                    type: 'string',
                    description: `scheduleId`,
                    isRequired: true,
                    maxLength: 500,
                    pattern: '(.*?)',
                },
                active: {
                    type: 'boolean',
                    description: `wether this callback is active or canceled`,
                    isRequired: true,
                },
            },
        },
        icsCalendarData: {
            type: 'string',
            description: `ics Data, can be downloaded as ics file, and then send as attachment in the mail`,
            maxLength: 500,
            pattern: '(.*?)',
        },
        emailSent: {
            type: 'boolean',
            description: `wether notification email has been send to visitor or not`,
        },
    },
};
//# sourceMappingURL=$callbackObject.js.map