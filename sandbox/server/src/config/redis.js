import Redis from 'ioredis';
import { deletePod } from '../kubernetes/pod.js';
import { deleteService } from '../kubernetes/service.js';

const redis = new Redis(process.env.REDIS_URL);

const subscriber = new Redis(process.env.REDIS_URL);

export async function createSandboxKey(sandboxId) {
    await redis.set(`sandbox:${sandboxId}`, JSON.stringify({
        status: "active",
    }), "EX", 60 * 2); // Set key to expire in 2 minutes
}

subscriber.config("SET", "notify-keyspace-events", "Ex");

subscriber.subscribe("__keyevent@0__:expired")

subscriber.on("message", (channel, key) => {
    console.log(`Key expired: ${key}`);

    const sandboxId = key.split(":")[1];

    deletePod(sandboxId)
        .then(() => console.log(`Deleted pod for sandbox ${sandboxId}`))
        .catch((err) => console.error(`Error deleting pod for sandbox ${sandboxId}:`, err));
    
    deleteService(sandboxId)
        .then(() => console.log(`Deleted service for sandbox ${sandboxId}`))
        .catch((err) => console.error(`Error deleting service for sandbox ${sandboxId}:`, err));
})

export default {subscriber};