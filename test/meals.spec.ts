import request from 'supertest'
import { app } from '../src/app'
import { describe, it, beforeEach, beforeAll, afterAll, expect } from 'vitest'
import { execSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'

describe('Users routes', () => {
    beforeAll(async () => {
        await app.ready()
    })

    afterAll(async () => {
        await app.close()
    })

    beforeEach(() => {
        execSync('npm run knex migrate:rollback --all')
        execSync('npm run knex migrate:latest')
    })

    it('should be able to create a new meal', async () => {

        const responseCreateUser = await request(app.server)
            .post('/users')
            .send({
                name: 'John Doe',
                email: "johndoe@mail.com"
            })
            .expect(201)


        const sessionId: any = responseCreateUser.get('Set-Cookie')

        const user_id = sessionId[0]?.split(';')[0]?.split('=')[1]
        await request(app.server)
            .post('/meals')
            .set('Cookie', String(sessionId))
            .send({
                name: 'fish and cheaps',
                description: "fryed fish with frency potatoes and rice",
                belongs_diet: false,
            })
            .expect(201)

        const responseMeals = await request(app.server)
            .get('/meals')


        expect(responseMeals.body).toEqual([
            expect.objectContaining({
                name: 'fish and cheaps',
                belongs_diet: false,
                user_id,
                description: 'fryed fish with frency potatoes and rice'
            })
        ])

    })



    it('should be able to update a meal', async () => {

        const responseCreateUser = await request(app.server)
            .post('/users')
            .send({
                name: 'John Doe',
                email: "johndoe@mail.com"
            })

        const sessionId: any = responseCreateUser.get('Set-Cookie')

        await request(app.server)
            .post('/meals')
            .set('Cookie', String(sessionId))
            .send({
                name: 'xxxxxBacalhau do pipo',
                description: "xxxxxxxArroz com bacalhau e palmito",
                belongs_diet: true,
            })
            .expect(201)

        const [meal] = (await request(app.server)
            .get('/meals')).body

        await request(app.server)
            .put('/meals/' + meal.id)
            .set('Cookie', String(sessionId))
            .send({
                name: 'Bacalhau do pipo',
                description: "Arroz com bacalhau e palmito",
                belongs_diet: false,
            })

        const responseUpdateMeal = await request(app.server)
            .get('/meals/'+ meal.id)

        
        expect(responseUpdateMeal.body).toEqual(expect.objectContaining({
            name: 'Bacalhau do pipo',
            description: "Arroz com bacalhau e palmito",
            belongs_diet: false,
        }))

    })


    it('should be try to update a meal not exists and receive 404', async () => {

        const responseCreateUser = await request(app.server)
            .post('/users')
            .send({
                name: 'John Doe',
                email: "johndoe@mail.com"
            })

        const sessionId: any = responseCreateUser.get('Set-Cookie')

        await request(app.server)
            .put('/meals/' + randomUUID() )
            .set('Cookie', String(sessionId))
            .send({
                name: 'Bacalhau do pipo',
                description: "Arroz com bacalhau e palmito",
                belongs_diet: false,
            }).expect(404)

    })



    it.only('should be able to update a meal', async () => {

        const responseCreateUser = await request(app.server)
            .post('/users')
            .send({
                name: 'John Doe',
                email: "johndoe@mail.com"
            })

        const sessionId: any = responseCreateUser.get('Set-Cookie')

        await request(app.server)
            .post('/meals')
            .set('Cookie', String(sessionId))
            .send({
                name: 'xxxxxBacalhau do pipo',
                description: "xxxxxxxArroz com bacalhau e palmito",
                belongs_diet: true,
            })
            .expect(201)

        const [meal] = (await request(app.server)
            .get('/meals')).body


        const responseSecondUser = await request(app.server)
        .post('/users')
        .send({
            name: 'John Doe second',
            email: "second@mail.com"
        })

        const sessionIdSecondUser: any = responseSecondUser.get('Set-Cookie')


        await request(app.server)
            .put('/meals/' + meal.id)
            .set('Cookie', String(sessionIdSecondUser))
            .send({
                name: 'Bacalhau do pipo',
                description: "Arroz com bacalhau e palmito",
                belongs_diet: false,
            }).expect(400)

    })



})