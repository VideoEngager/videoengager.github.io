export type callbackObject = {
    genesys?: {
        conversation?: {
            id: string;
        };
    };
    videoengager?: {
        autoAnswer: boolean;
        /**
         * visitor Name
         */
        name: string;
        /**
         * visitor Email
         */
        email: string;
        /**
         * visitor Phone
         */
        phone: string;
        /**
         * subject
         */
        subject: string;
        /**
         * Visitor Join Meeting URL
         */
        meetingUrl: string;
        /**
         * Short URL Code for generating short URL
         */
        code: string;
        /**
         * scheduled Time
         */
        date: number;
        /**
         * Agent Meeting URL, Only Available upon creation
         */
        agentUrl?: string;
        /**
         * Created At
         */
        created: string;
        /**
         * Duration of callback in minutes
         */
        duration: number;
        /**
         * scheduleId
         */
        scheduleId: string;
        /**
         * wether this callback is active or canceled
         */
        active: boolean;
    };
    /**
     * ics Data, can be downloaded as ics file, and then send as attachment in the mail
     */
    icsCalendarData?: string;
    /**
     * wether notification email has been send to visitor or not
     */
    emailSent?: boolean;
};
//# sourceMappingURL=callbackObject.d.ts.map