const { ApolloServer, PubSub } = require("apollo-server-express");
const express = require("express");
const expressPlayground = require("graphql-playground-middleware-express")
  .default;
const { readFileSync } = require("fs");

const typeDefs = readFileSync("./typeDefs.graphql", "UTF-8");
const resolvers = require("./resolvers");

const { GraphQLScalarType } = require("graphql");

const { MongoClient } = require("mongodb");
require("dotenv").config();

const { createServer } = require("http");

async function start() {
  const app = express();
  const MONGO_DB = process.env.DB_HOST;

  const client = await MongoClient.connect(MONGO_DB, { useNewUrlParser: true });

  const db = client.db();

  const pubsub = new PubSub();
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({ req, connection }) => {
      const githubToken = req
        ? req.headers.authorization
        : connection.context.Authorization;
      const currentUser = await db.collection("users").findOne({ githubToken });
      return { db, currentUser, pubsub };
    }
  });

  server.applyMiddleware({ app });

  app.get("/", (req, res) => res.end("Welcome to the PhotoShare Api"));

  app.get("/playground", expressPlayground({ endpoint: "/graphql" }));

  const httpServer = createServer(app);
  server.installSubscriptionHandlers(httpServer);
  httpServer.listen({ port: 4000 }, () =>
    console.log(`GraphQL Server running at localhost:4000${server.graphqlPath}`)
  );
}

start();
