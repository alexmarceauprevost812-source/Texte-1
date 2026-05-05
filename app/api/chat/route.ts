import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

import {
  getSystemPrompt,
  isChatMode,
  resolveAnthropicClient,
  type ChatMode,
} from "@/lib/chat/anthropic";
import {
  buildContentBlocks,
  type IncomingAttachment,
} from "@/lib/chat/file-processing";
import { DEFAULT_MODEL, isModelId, type ModelId } from "@/lib/models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type IncomingMessage = {
  role: "user" | "assistant";
  content: string;
  attachments?: IncomingAttachment[];
};

type RequestBody = {
  messages: IncomingMessage[];
  model?: ModelId;
  mode?: ChatMode;
  apiKey?: string;
  customInstructions?: string;
  userName?: string;
};

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function buildPerModelParams(model: ModelId): {
  thinking?: Anthropic.ThinkingConfigParam;
  output_config?: Anthropic.MessageCreateParams["output_config"];
} {
  // Per the Claude API skill:
  // - Opus 4.7: adaptive thinking + xhigh effort (best for coding/agentic).
  // - Sonnet 4.6: adaptive thinking + medium effort (the sweet spot).
  // - Haiku 4.5: effort errors (400). Skip thinking too — keep it lean.
  if (model === "claude-opus-4-7") {
    return {
      thinking: { type: "adaptive" },
      output_config: { effort: "xhigh" },
    };
  }
  if (model === "claude-sonnet-4-6") {
    return {
      thinking: { type: "adaptive" },
      output_config: { effort: "medium" },
    };
  }
  return {};
}

export async function POST(req: NextRequest) {
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return jsonError("Corps de requête JSON invalide.", 400);
  }

  const client = resolveAnthropicClient(body.apiKey);
  if (!client) {
    return jsonError(
      "Aucune clé Anthropic disponible. Renseignez la vôtre dans les Paramètres ou configurez ANTHROPIC_API_KEY côté serveur.",
      500,
    );
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return jsonError("Aucun message fourni.", 400);
  }

  const model: ModelId = isModelId(body.model) ? body.model : DEFAULT_MODEL;
  const mode: ChatMode = isChatMode(body.mode) ? body.mode : "codex";
  const baseSystemPrompt = getSystemPrompt(mode);

  const userName =
    typeof body.userName === "string"
      ? body.userName.trim().slice(0, 200)
      : "";
  const customInstructions =
    typeof body.customInstructions === "string"
      ? body.customInstructions.trim().slice(0, 8000)
      : "";

  const augmentations: string[] = [];
  if (userName) {
    augmentations.push(
      `\n\n## Utilisateur\n\nL'utilisateur s'appelle « ${userName} ». Adressez-vous à lui par ce nom quand c'est naturel.`,
    );
  }
  if (customInstructions) {
    augmentations.push(
      `\n\n## Instructions personnalisées de l'utilisateur\n\nL'utilisateur a défini les préférences suivantes pour vos réponses :\n\n${customInstructions}\n\nRespectez-les sauf si elles contredisent les règles ci-dessus.`,
    );
  }
  const systemPrompt = baseSystemPrompt + augmentations.join("");

  let messages: Anthropic.MessageParam[];
  try {
    messages = await Promise.all(
      body.messages.map(async (m) => ({
        role: m.role,
        content: await buildContentBlocks(m.content, m.attachments ?? []),
      })),
    );
  } catch (error) {
    return jsonError(
      `Échec du traitement des fichiers joints: ${
        error instanceof Error ? error.message : String(error)
      }`,
      400,
    );
  }

  const perModel = buildPerModelParams(model);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(payload: unknown) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(payload)}\n\n`),
        );
      }

      try {
        const liveStream = client.messages.stream({
          model,
          max_tokens: 32000,
          system: [
            {
              type: "text",
              text: systemPrompt,
              cache_control: { type: "ephemeral" },
            },
          ],
          messages,
          ...perModel,
        });

        send({ type: "start", model });

        for await (const event of liveStream) {
          if (event.type === "content_block_delta") {
            if (event.delta.type === "text_delta") {
              send({ type: "text", text: event.delta.text });
            }
          } else if (event.type === "message_delta") {
            if (event.delta.stop_reason) {
              send({ type: "stop", reason: event.delta.stop_reason });
            }
          }
        }

        const finalMessage = await liveStream.finalMessage();
        send({
          type: "done",
          usage: {
            input_tokens: finalMessage.usage.input_tokens,
            output_tokens: finalMessage.usage.output_tokens,
            cache_read_input_tokens:
              finalMessage.usage.cache_read_input_tokens ?? 0,
            cache_creation_input_tokens:
              finalMessage.usage.cache_creation_input_tokens ?? 0,
          },
        });
      } catch (error) {
        let message = "Erreur inconnue";
        let status = 500;
        if (error instanceof Anthropic.RateLimitError) {
          message = "Limite de débit atteinte. Réessayez plus tard.";
          status = 429;
        } else if (error instanceof Anthropic.AuthenticationError) {
          message = "Clé API Anthropic invalide.";
          status = 401;
        } else if (error instanceof Anthropic.APIError) {
          message = `Erreur API (${error.status}): ${error.message}`;
          status = error.status ?? 500;
        } else if (error instanceof Error) {
          message = error.message;
        }
        send({ type: "error", error: message, status });
      } finally {
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
