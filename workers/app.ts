import { nanoid } from "nanoid";
import Parser from "postal-mime";
import { createRequestHandler } from "react-router";
import { MAIL_RETENTION_MS } from "../app/utils/mail-retention";

declare module "react-router" {
	export interface AppLoadContext {
		cloudflare: {
			env: Env;
			ctx: ExecutionContext;
		};
	}
}

const requestHandler = createRequestHandler(
	() => import("virtual:react-router/server-build"),
	import.meta.env.MODE,
);

const CLEANUP_BATCH_SIZE = 500;

async function cleanupExpiredEmails(env: Env) {
	const cutoff = Date.now() - MAIL_RETENTION_MS;

	while (true) {
		const { results } = await env.D1.prepare(
			"SELECT id FROM emails WHERE time < ? ORDER BY time ASC LIMIT ?",
		)
			.bind(cutoff, CLEANUP_BATCH_SIZE)
			.all<{ id: string }>();

		const ids = (results ?? [])
			.map((row) => row.id)
			.filter((id): id is string => Boolean(id));

		if (ids.length === 0) {
			break;
		}

		await env.R2.delete(ids);
		const placeholders = ids.map(() => "?").join(", ");
		await env.D1.prepare(`DELETE FROM emails WHERE id IN (${placeholders})`)
			.bind(...ids)
			.run();

		if (ids.length < CLEANUP_BATCH_SIZE) {
			break;
		}
	}
}

export default {
	async fetch(request, env, ctx) {
		return requestHandler(request, {
			cloudflare: { env, ctx },
		});
	},
	async email(msg, env) {
		const parser = new Parser();
		const ab = await new Response(msg.raw).arrayBuffer();
		const parsed = await parser.parse(ab);
		const id = nanoid();

		await env.D1.prepare(
			"INSERT INTO emails (id, to_address, from_name, from_address, subject, time) VALUES (?, ?, ?, ?, ?, ?)",
		)
			.bind(id, msg.to, parsed.from?.name, parsed.from?.address, parsed.subject, Date.now())
			.run();

		await env.R2.put(id, ab);
	},
	async scheduled(_controller, env, ctx) {
		ctx.waitUntil(cleanupExpiredEmails(env));
	},
} satisfies ExportedHandler<Env>;
