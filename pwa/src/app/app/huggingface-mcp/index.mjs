import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const HF_TOKEN = process.env.HF_TOKEN;

const MODELS = {
  kimi: "moonshotai/Kimi-K2-Instruct-0905",
  deepseek: "deepseek-ai/DeepSeek-V4-Pro:together"
};

const server = new Server(
  {
    name: "huggingface-ai",
    version: "1.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "ask_kimi",
        description: "Ask a question to the Kimi-K2 model (Good for reasoning).",
        inputSchema: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description: "The question or prompt.",
            },
          },
          required: ["prompt"],
        },
      },
      {
        name: "ask_deepseek",
        description: "Ask a question to DeepSeek V4 Pro (Excellent for Code & Logic).",
        inputSchema: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description: "The question or prompt.",
            },
          },
          required: ["prompt"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const modelKey = request.params.name === "ask_kimi" ? "kimi" : request.params.name === "ask_deepseek" ? "deepseek" : null;
  
  if (!modelKey) {
    throw new Error("Tool not found");
  }

  const prompt = request.params.arguments.prompt;
  const modelId = MODELS[modelKey];

  try {
    const response = await fetch(`https://router.huggingface.co/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HF API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    return {
      content: [{ type: "text", text: content }],
    };
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
