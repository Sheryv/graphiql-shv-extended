import {ApolloServer, BaseContext, GraphQLRequestContext} from '@apollo/server';
import {startStandaloneServer} from '@apollo/server/standalone';

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

        // Optional: Log the full query if you want more detail
        // console.log(`Query: ${requestContext.request.query}`);

        return {
            async didEncounterErrors(rc: any) {
                console.error(`[${date}] ❌ Errors:`, rc.errors);
            },
        };
    },
};

// 3. Add the plugin to the server instance
const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [requestLogger] // <--- Plugin added here
});

async function startServer() {
    const {url} = await startStandaloneServer(server, {
        listen: {port: 4000},
    });
    console.log(`\n🚀 Mock GraphQL Server ready at: ${url}`);
}

startServer();
