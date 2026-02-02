import "dotenv/config";
import express from "express";
import cors from "cors";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";

import { connectDb } from "./db.js";
import { typeDefs } from "./graphql/typeDefs.js";
import { resolvers } from "./graphql/resolvers.js";
import { getUserFromReq } from "./graphql/auth.js";

const PORT = process.env.PORT || 4000;

async function start() {
  await connectDb(process.env.MONGODB_URI);

  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();

  const app = express();

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN?.split(",") || true,
      credentials: true
    })
  );
  app.use(express.json());

  app.get("/health", (_, res) => res.json({ ok: true }));

  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: async ({ req }) => ({ user: await getUserFromReq(req) })
    })
  );

  app.listen(PORT, () => console.log(`GraphQL running: http://localhost:${PORT}/graphql`));
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});
