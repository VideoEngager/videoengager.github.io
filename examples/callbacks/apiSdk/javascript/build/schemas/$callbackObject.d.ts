export declare const $callbackObject: {
    readonly properties: {
        readonly genesys: {
            readonly properties: {
                readonly conversation: {
                    readonly properties: {
                        readonly id: {
                            readonly type: "string";
                            readonly isRequired: true;
                            readonly maxLength: 500;
                            readonly pattern: "(.*?)";
                        };
                    };
                };
            };
        };
        readonly videoengager: {
            readonly properties: {
                readonly autoAnswer: {
                    readonly type: "boolean";
                    readonly isRequired: true;
                };
                readonly name: {
                    readonly type: "string";
                    readonly description: "visitor Name";
                    readonly isRequired: true;
                    readonly maxLength: 500;
                    readonly pattern: "(.*?)";
                };
                readonly email: {
                    readonly type: "string";
                    readonly description: "visitor Email";
                    readonly isRequired: true;
                    readonly maxLength: 150;
                    readonly pattern: "(.*?)";
                };
                readonly phone: {
                    readonly type: "string";
                    readonly description: "visitor Phone";
                    readonly isRequired: true;
                    readonly maxLength: 500;
                    readonly pattern: "(.*?)";
                };
                readonly subject: {
                    readonly type: "string";
                    readonly description: "subject";
                    readonly isRequired: true;
                    readonly maxLength: 500;
                    readonly pattern: "(.*?)";
                };
                readonly meetingUrl: {
                    readonly type: "string";
                    readonly description: "Visitor Join Meeting URL";
                    readonly isRequired: true;
                    readonly maxLength: 500;
                    readonly pattern: "(.*?)";
                };
                readonly code: {
                    readonly type: "string";
                    readonly description: "Short URL Code for generating short URL";
                    readonly isRequired: true;
                    readonly maxLength: 500;
                    readonly pattern: "(.*?)";
                };
                readonly date: {
                    readonly type: "number";
                    readonly description: "scheduled Time";
                    readonly isRequired: true;
                    readonly format: "int64";
                };
                readonly agentUrl: {
                    readonly type: "string";
                    readonly description: "Agent Meeting URL, Only Available upon creation";
                    readonly maxLength: 500;
                    readonly pattern: "(.*?)";
                };
                readonly created: {
                    readonly type: "string";
                    readonly description: "Created At";
                    readonly isRequired: true;
                    readonly maxLength: 500;
                    readonly pattern: "(.*?)";
                };
                readonly duration: {
                    readonly type: "number";
                    readonly description: "Duration of callback in minutes";
                    readonly isRequired: true;
                    readonly format: "int64";
                };
                readonly scheduleId: {
                    readonly type: "string";
                    readonly description: "scheduleId";
                    readonly isRequired: true;
                    readonly maxLength: 500;
                    readonly pattern: "(.*?)";
                };
                readonly active: {
                    readonly type: "boolean";
                    readonly description: "wether this callback is active or canceled";
                    readonly isRequired: true;
                };
            };
        };
        readonly icsCalendarData: {
            readonly type: "string";
            readonly description: "ics Data, can be downloaded as ics file, and then send as attachment in the mail";
            readonly maxLength: 500;
            readonly pattern: "(.*?)";
        };
        readonly emailSent: {
            readonly type: "boolean";
            readonly description: "wether notification email has been send to visitor or not";
        };
    };
};
//# sourceMappingURL=$callbackObject.d.ts.map