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

function buildCorsOptions() {
  const raw = process.env.CORS_ORIGIN || "";
  const list = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);


  if (list.length === 0) {
    return {
      origin: true,
      credentials: false,
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"]
    };
  }


  if (list.includes("*")) {
    return {
      origin: true,
      credentials: false,
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"]
    };
  }


  return {
    origin: list,
    credentials: false,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  };
}

async function start() {
  await connectDb(process.env.MONGODB_URI);

  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();

  const app = express();

  const corsOptions = buildCorsOptions();
  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions));

  app.use(express.json());

  app.get("/health", (_, res) => res.json({ ok: true }));

  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: async ({ req }) => ({ user: await getUserFromReq(req) })
    })
  );

  app.listen(PORT, () => console.log(`GraphQL running on port ${PORT} (/graphql)`));
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});
