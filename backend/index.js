const { ApolloServer } = require("apollo-server")
const { makeExecutableSchema } = require("@graphql-tools/schema")
const { readFileSync } = require("fs")
const { join } = require("path")
const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcrypt")
require("dotenv").config()

const prisma = new PrismaClient()

// Define GraphQL schema
const typeDefs = readFileSync(
  join(__dirname, "graphql", "schema.graphql"),
  "utf8"
)

// Define resolvers
const resolvers = {
  Query: {
    users: async () => await prisma.user.findMany(),
    posts: async () => await prisma.post.findMany(),
    appointments: async () => await prisma.appointment.findMany(),
    user: async (_, { id }) => await prisma.user.findUnique({ where: { id } }),
    post: async (_, { id }) => await prisma.post.findUnique({ where: { id } }),
    appointment: async (_, { id }) => await prisma.appointment.findUnique({ where: { id }}),
  },
  User: {
    posts: async (parent) =>
      await prisma.post.findMany({ where: { authorId: parent.id } }),
    userAppointments: async (parent) =>
      await prisma.appointment.findMany({ where: { userId: parent.id } }),
    tutorAppointments: async (parent) =>
      await prisma.appointment.findMany({ where: { tutorId: parent.id } }),
  },
  Post: {
    author: async (parent) =>
      await prisma.user.findUnique({ where: { id: parent.authorId } }),
    appointments: async (parent) =>
      await prisma.appointment.findMany({ where: { postId: parent.id } }),
  },
  Appointment: {
    user: async (parent) =>
      await prisma.user.findUnique({ where: { id: parent.userId } }),
    tutor: async (parent) =>
      await prisma.user.findUnique({ where: { id: parent.tutorId } }),
    post: async (parent) =>
      await prisma.post.findUnique({ where: { id: parent.postId } }),
  },

  Mutation: {
    // ----- Create -----
    createUser: async (_, { input }) => {
      const { firstName, lastName, email, password_hash, role } = input
      try {
        const hashedPassword = await bcrypt.hash(password_hash, 10)
        return await prisma.user.create({
          data: {
            firstName,
            lastName,
            email,
            password_hash: hashedPassword,
            role,
          },
        })
      } catch (error) {
        console.error(error)
        throw new Error(`Failed to create user`)
      }
    },
    createPost: async (_, { input }) => {
      try {
        const { title, content, published, authorId } = input
        return await prisma.post.create({
          data: {
            title,
            content,
            published,
            authorId,
          },
        })
      } catch (error) {
        console.error(error)
        throw new Error(`Failed to create post`)
      }
    },
    createAppointment: async (_, { input }) => {
      try {
        const { date, userId, tutorId, postId} = input
        return await prisma.appointment.create({
          data: {
            date,
            userId,
            tutorId,
            postId,
          }
        })
      } catch (error){
        console.error(error)
        throw new Error(`Failed to create appointment`)
      }
    },
    // ----- Update -----
    updateUser: async (_, { id, input }) => {
      try {
        const { firstName, lastName, email, role } = input
        return await prisma.user.update({
          where: { id },
          data: { firstName, lastName, email, role },
        })
      } catch (error) {
        console.error(error)
        throw new Error("Failed to update user")
      }
    },
    updatePost: async (_, { id, input }) => {
      const { title, content, published } = input
      try{
        return await prisma.post.update({
          where: { id },
          data: { title, content, published },
        })
      } catch (error) {
        console.error(error)
        throw new Error("Failed to update post")
      }
    },
    // ----- Delete -----
    deleteUser: async (_, { id }) => {
      return await prisma.user.delete({
        where: { id },
      })
    },
    deletePost: async (_, { id }) => {
      return await prisma.post.delete({
        where: { id },
      })
    },
  },
}

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
})

// Create the Apollo Server
const server = new ApolloServer({ typeDefs, resolvers })

const port = process.env.PORT || 4000

// Start the server
server.listen({ port }).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`)
})
