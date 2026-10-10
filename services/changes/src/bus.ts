import * as amqp from "amqplib";

const EXCHANGE = "itil.events";

let channel: amqp.Channel | null = null;

async function getChannel(): Promise<amqp.Channel> {
  if (channel) return channel;
  const url = process.env.RABBITMQ_URL ?? "amqp://tickit:tickit@localhost:5672";
  for (let attempt = 1; attempt <= 12; attempt++) {
    try {
      const conn = await amqp.connect(url);
      const ch = await conn.createChannel();
      if (!ch) throw new Error("canal no disponible");
      await ch.assertExchange(EXCHANGE, "topic", { durable: true });
      channel = ch;
      // Un reinicio de RabbitMQ mata el canal cacheado: invalidarlo para
      // que el proximo publish reconecte en vez de perder el evento
      conn.on("close", () => {
        if (channel === ch) channel = null;
      });
      console.log("[bus] conectado a RabbitMQ");
      return ch;
    } catch (err) {
      console.warn(`[bus] intento ${attempt}/12 fallido:`, (err as Error).message);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  throw new Error("[bus] no se pudo conectar a RabbitMQ");
}

export async function publishEvent(
  routingKey: string,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    const ch = await getChannel();
    ch.publish(
      EXCHANGE,
      routingKey,
      Buffer.from(
        JSON.stringify({ occurredAt: new Date().toISOString(), ...payload }),
      ),
      { persistent: true },
    );
  } catch (err) {
    channel = null; // canal probablemente muerto: reconectar en el proximo evento
    console.error("[bus] fallo publicando evento:", (err as Error).message);
  }
}
