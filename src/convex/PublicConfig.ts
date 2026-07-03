import { query } from "./_generated/server";

export const getClerkPublishableKey = query({
    args: {},
    handler: async () => {
        return process.env.REACT_APP_CLERK_PUBLISHABLE_KEY ?? null;
    }
})
