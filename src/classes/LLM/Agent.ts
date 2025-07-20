import * as readline from "readline";
import * as fs from "fs";
import { BaseAdapter } from "./adapters/Base";

export class Agent {
  lockFile: string = "";
  rl: readline.Interface | null = null;
  apiKey: string = process.env.OPENAI_API_KEY || "";
  adapter: BaseAdapter | undefined;

  constructor() {}

  setLockFilePath(lockFilePath: string) {
    this.lockFile = lockFilePath;
  }

  setAdapter(adapter: BaseAdapter) {
    this.adapter = adapter;
  }

  async *ask(query: string): AsyncGenerator<string> {
    if (!this.adapter) {
      throw new Error(
        "Adapter is not set. Please set an adapter before asking."
      );
    }
    // console.log("Asking LLM with query:", query);
    try {
      for await (const chunk of this.adapter.stream(query)) {
        yield chunk;
      }
    } catch (error) {
      // console.error('Error while asking LLM:', error);
      console.log(
        `Error: ${
          error instanceof Error
            ? error.message +
              `, make sure your API has access to the ${this.adapter.model} model`
            : "Unknown error"
        }`
      );
    }
  }

  async streamLLMResponse(query: string) {
    for await (const chunk of this.ask(query)) {
      process.stdout.write(chunk);
    }
    process.stdout.write("\n"); // Ensure newline after streaming
    if (this.rl) this.rl.prompt();
  }

  
}
