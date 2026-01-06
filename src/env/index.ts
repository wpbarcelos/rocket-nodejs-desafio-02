import z from "zod";
import { config } from 'dotenv'

if (process.env.NODE_ENV === 'test') {
    config({ path: '.env.test' })
} else {
    config()
}

const envSchema = z.object({
    PORT: z.coerce.number().default(3333),
    DATABASE_CLIENT: z.enum(['pg', 'sqlite']),
    DATABASE_URL: z.string(),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('production')
})


const _env = envSchema.safeParse(process.env)

if (_env.success === false) {
    console.log("❌ invalid environment variables!" + _env.error)
    throw new Error('invalid environment variables')
}

export const env = _env.data