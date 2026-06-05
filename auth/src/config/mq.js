import amqplib from 'amqplib/callback_api';

const QUEUE = 'auth_notification_queue';

const connection = await amqplib.connect(process.env.RABBITMQ_URL)

const channel = await connection.createChannel();

channel.assertQueue(QUEUE, { durable: true });

export async function sendAuthNotification(message) {
  channel.sendToQueue(
    QUEUE, //BINARY DATA
    Buffer.from(JSON.stringify(message)), 
    { persistent: true }
  );
}