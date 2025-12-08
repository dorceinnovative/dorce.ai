import { Queue, Worker } from 'bullmq'
import IORedis from 'ioredis'
import dotenv from 'dotenv'

dotenv.config()

const connection = new IORedis(process.env.REDIS_URL || 'redis://redis:6379')

const queue = new Queue('tasks', { connection })

const worker = new Worker(
  'tasks',
  async job => {
    console.log(`Processing job: ${job.id}`, job.data)
    // Simulate processing
    await new Promise(res => setTimeout(res, 2000))
    console.log(`✅ Done with job: ${job.id}`)
  },
  { connection }
)

console.log('🚀 Worker started and listening for jobs...')
