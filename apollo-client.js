import { ApolloClient, InMemoryCache } from "@apollo/client";

const client = new ApolloClient({
  uri: "https://sevenhills.stepzen.net/api/modest-salamander/__graphql",
  headers: {
    Authorization: `Apikey ${process.env.NEXT_PUBLIC_STEPZEZ_API_KEY}`,
  },
  cache: new InMemoryCache(),
});

export default client;
