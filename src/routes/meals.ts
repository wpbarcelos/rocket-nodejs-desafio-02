import { FastifyInstance } from "fastify";
import z from "zod";
import { knex } from "../database";
import { randomUUID } from "node:crypto";
import { request } from "node:http";

export async function mealsRouter(app: FastifyInstance) {

    app.get('/', async (request, reply) => {
        const meals = await knex('meals').select("*")
            .then(rows => rows.map((r: any) => ({ ...r, belongs_diet: !!r.belongs_diet })))
        return reply.send(meals)
    })

    app.put('/:id', async (request, reply) => {
        const getParamsSchema = z.object({
            id: z.uuid()
        })
        const { id } = getParamsSchema.parse(request.params)

        const updateMealBodySchema = z.object({
            name: z.string(),
            description: z.string(),
            belongs_diet: z.boolean()
        })


        const { name, description, belongs_diet } = updateMealBodySchema.parse(request.body)
        let sessionId = request.cookies.sessionId

        if (!sessionId) {
            throw new Error("Invalid sessionId")
        }

        const mealExists = await knex('meals').select('*').where('id', id).first()

        if (!mealExists) {
            return reply.status(404).send({ message: "meal not exists" })
        }

        if (mealExists.user_id !== sessionId) {
            return reply.status(400).send({ message: "meal not belong to this users." })
        }

        await knex('meals')
            .where('id', id)
            .where('user_id', sessionId)
            .update({
                name,
                description,
                belongs_diet
            })

        return reply.status(200).send()

    })

    app.get('/:id', async (request, reply) => {
        const getParamsSchema = z.object({
            id: z.string()
        })
        const { id } = getParamsSchema.parse(request.params)

        const meal = await knex('meals').select("*")
            .where('id', id)
            .first()
        if (!meal) {
            return reply.status(404).send({ message: "meal not found" })
        }

        meal.belongs_diet = !!meal.belongs_diet

        return reply.send(meal);

    })

    app.post('/', async (request, reply) => {

        const createMealSchemaBodySchema = z.object({
            name: z.string(),
            description: z.string(),
            belongs_diet: z.boolean()
        })

        const { name, description, belongs_diet } = createMealSchemaBodySchema.parse(request.body)

        let sessionId = request.cookies.sessionId

        if (!sessionId) {
            throw new Error("Invalid sessionId")
        }
        await knex('meals').insert({
            id: randomUUID(),
            name,
            description,
            belongs_diet,
            user_id: sessionId
        })
        return reply.status(201).send()

    })

    app.get('/metrics', async (request, reply) => {

        let sessionId = request.cookies.sessionId

        if (!sessionId) {
            throw new Error("Invalid sessionId")
        }

        const meals = await knex('meals').where('user_id', sessionId)
            .select('id', 'name', 'belongs_diet').orderBy('created_at');

        const metrics = {
            total: 0,
            belongs_diet: 0,
            not_belongs_diet: 0,
            better_sequence_diet: 0
        }

        let bestStreak = 0
        let currentStreak = 0;

        meals.forEach(meal => {
            if (meal.belongs_diet) {
                currentStreak++
                metrics.belongs_diet++
            } else {
                currentStreak = 0;
                metrics.not_belongs_diet++
            }
            if (currentStreak > bestStreak) {
                bestStreak = currentStreak
            }
        })

        metrics.total = meals.length;
        metrics.better_sequence_diet = bestStreak;

        return reply.send(metrics)

    })
}