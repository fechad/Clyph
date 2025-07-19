import { BaseAdapter } from "./Base";
import axios from "axios";
import { systemPrompt } from "../utils/prompts";

export class OpenAIAdapter extends BaseAdapter {
  constructor(apiKey: string, model: string) {
    super("https://api.openai.com/v1", model, apiKey);
  }

  async ask(query: string): Promise<string> {
    const messages = [
      {
        role: "system",
        content: [
          {
            type: "text",
            text: systemPrompt,
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: query,
          },
        ],
      },
    ];

    const response = await axios.post(
      `${this.baseUrl}/chat/completions`,
      {
        model: this.model,
        messages,
        response_format: { type: "text" },
        temperature: 1,
        max_completion_tokens: 2048,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const contentBlocks = response.data.choices[0].message.content;
    if (Array.isArray(contentBlocks)) {
      return contentBlocks
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("");
    }
    return "";
  }

  async *stream(query: string): AsyncGenerator<string> {
    const messages = [
      {
        role: "system",
        content: [
          {
            type: "text",
            text: systemPrompt,
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: query,
          },
        ],
      },
    ];

    const response = await axios.post(
      `${this.baseUrl}/chat/completions`,
      {
        model: this.model,
        messages,
        stream: true,
        response_format: { type: "text" },
        temperature: 1,
        max_completion_tokens: 2048,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        responseType: "stream",
      }
    );

    const stream = response.data;

    for await (const chunk of stream) {
      // console.log('Received chunk:', chunk.toString());
      const lines = chunk.toString().split("\n").filter(Boolean);
      //   console.log('Processing lines:', lines);
      for (const line of lines) {
        const data = line.replace("data: ", "").trim();
        // console.log('Processing data:', data);
        if (data.trim() === "[DONE]") {
            // console.log(data.trim());
            return; // End of stream
        }
        if (data) {
          try {
            // console.log('Processing data:', data);
            const payload = JSON.parse(data);
            // console.log('Parsed payload.choices?.[0]?.delta?:', payload.choices?.[0]?.delta);
            const deltaContent = payload.choices?.[0]?.delta?.content;
            if (Array.isArray(deltaContent)) {
              for (const block of deltaContent) {
                if (block.type === "text" && block.text) {
                  yield block.text;
                }
              }
            } else if (typeof deltaContent === "string") {
              yield deltaContent;
            }
          } catch (err) {
            // Ignore malformed JSON in stream
            // console.error("Error parsing stream chunk:", err);
          }
        }
      }
    }
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }
}
