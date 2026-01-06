import fastify from "fastify";
import cookie from "@fastify/cookie"
import { usersRoutes } from "./routes/users";
import { mealsRouter } from "./routes/meals";

export  const app  = fastify()

app.register(cookie)
app.register(usersRoutes, { prefix: '/users'})
app.register(mealsRouter, { prefix: '/meals'})