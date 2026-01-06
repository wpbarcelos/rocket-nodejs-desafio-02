import { FastifyInstance } from "fastify";
import z from "zod";
import { knex } from "../database";
import { randomUUID } from "node:crypto";

export async function usersRoutes(app: FastifyInstance) {

    app.post('/', async (request, reply) => {
        const createUserTransactionBodySchema = z.object({
            email: z.email(),
            name: z.string().max(255).min(2)
        })

        const { email, name } = createUserTransactionBodySchema.parse(request.body)

        const id = randomUUID()

        await knex('users').insert({
            id,
            email,
            name
        })

        reply.cookie('sessionId', id, {
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 7 days
        })

        return reply.status(201).send()
    })
}