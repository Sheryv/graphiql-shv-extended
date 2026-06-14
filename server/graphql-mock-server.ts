import {ApolloServer, BaseContext, GraphQLRequestContext} from '@apollo/server';
import {expressMiddleware} from '@as-integrations/express4';
import express from 'express'; // Imported Express
import cors from 'cors';


// 1. Schema and Mock Data (Same as before)
const typeDefs = `#graphql
  type User { id: ID!, name: String!, email: String!, role: String! }
  type Raw { content: String! }
  type Edge { node: User!, _nodeRaw: Raw! }
  type Result { edges: [Edge!]! }
  type Query { users: Result!, user(id: ID!): User }
`;

const mockUsers = [
    {id: '1', name: 'John Doe', email: 'john@example.com', role: 'Admin'},
    {id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'User'},
    {id: '3', name: 'Alex Gomez', email: 'alex@example.com', role: 'Editor'},
];

const resolvers = {
    Query: {
        users: () => ({
            edges: mockUsers.map(u => (
                {
                    node: u,
                    _nodeRaw: {
                        content: JSON.stringify(u)
                    },
                }
            ))
        }),
        user: (_: any, args: { id: string }) => mockUsers.find(u => u.id === args.id),
    },
};

// 2. Logging Plugin
const requestLogger = {
    async requestDidStart(requestContext: GraphQLRequestContext<BaseContext>) {
        const date = new Date().toISOString();
        const operationName = requestContext.request.operationName || 'Unnamed Operation';

        let headers = requestContext.request.http?.headers && [...requestContext.request.http.headers.entries()].map(([k, v]) => k + '=' + v).join('\n\t') || '';
        console.log(`[${date}] 🛰️  Incoming Request: ${operationName}\nHeaders: \n\t${headers}`);

        return {
            async didEncounterErrors(rc: any) {
                console.error(`[${date}] ❌ Errors:`, rc.errors);
            },
        };
    },
};

// 3. Create the server instance
const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [requestLogger]
});

async function startServer() {

    await server.start();

    const app = express();

    // 2. Define CORS logic based on environment variables
    if (process.env.NODE_ENV === 'development') {
        // Option A: In development, "disable" restrictions by allowing ALL origins
        app.use(cors());
        console.log('🔓 CORS restrictions dropped (Development Mode)');
    } else if (process.env.ALLOWED_ORIGIN) {
        // Option B: In production, explicitly restrict to the domain provided in your env
        app.use(cors({
            origin: process.env.ALLOWED_ORIGIN,
            credentials: true // Optional: Allow cookies/headers if needed
        }));
        console.log(`🔒 CORS locked down to: ${process.env.ALLOWED_ORIGIN}`);
    } else {
        // Fallback: If no env variable is provided, enforce strict same-origin (no CORS headers)
        console.log('🛡️  Strict Same-Origin enforced (No CORS headers applied)');
    }


    // By NOT adding any 'cors' middleware here, the server won't emit CORS headers.
    // This forces the browser to block all cross-origin requests, ensuring strict same-origin behavior.
    app.use(
        '/graphql',
        express.json(), // Middleware to parse JSON request bodies
        expressMiddleware(server)
    );

    const PORT = 4000;
    app.listen(PORT, () => {
        console.log(`\n🚀 Mock GraphQL Server ready at: http://localhost:${PORT}/graphql`);
    });
}

startServer();
