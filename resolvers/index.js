const { GraphQLScalarType } = require("graphql");

const users = require("../stubs/users");
const photos = require("../stubs/photos");
const tags = require("../stubs/tags");

let _id = 0;

const resolvers = {
  Query: {
    totalPhotos: (parent, args, { db }) =>
      db.collection("photos").estimatedDocumentCount(),
    allPhotos: (parent, args, { db }) =>
      db
        .collection("photos")
        .find()
        .toArray(),
    totalUsers: (parent, args, { db }) =>
      db.collection("users").estimatedDocumentCount(),
    allUsers: (parent, args, { db }) =>
      db
        .collection("users")
        .find()
        .toArray()
  },
  Mutation: {
    postPhoto(parent, args) {
      const newPhoto = {
        id: _id++,
        ...args.input,
        created: new Date()
      };
      photos.push(newPhoto);
      return newPhoto;
    }
  },
  Photo: {
    url: parent => `http://yoursite.com/img/${parent.id}.jpg`,
    postedBy: parent => {
      return users.find(u => u.githubLogin === parent.githubUser);
    },
    taggedUsers: parent => {
      return tags
        .filter(tag => tag.photoID === parent.id)
        .map(tag => tag.userID)
        .map(userID => users.find(u => u.githubLogin === userID));
    }
  },
  User: {
    postedPhotos: parent => {
      return photos.filter(p => p.githubUser === parent.githubLogin);
    },
    inPhotos: parent => {
      return tags
        .filter(tag => tags.userID === parent.id)
        .map(tag => tag.photoID)
        .map(photoID => photos.find(p => p.id === photoID));
    }
  },
  DateTime: new GraphQLScalarType({
    name: "DateTime",
    description: "A valid date time value.",
    parseValue: value => new Date(value),
    serialize: value => new Date(value).toISOString(),
    parseLiteral: ast => ast.value
  })
};

module.exports = resolvers;
