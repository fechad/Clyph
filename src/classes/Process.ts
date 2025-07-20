#!/usr/bin/env node

import { exec } from "child_process";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import { API_KEY, MODEL, PROVIDER } from "../utils/env";
import { Agent } from "./LLM/Agent";
import * as readline from "readline";
import { supportedModels } from "./LLM/utils/models";

export class Process {
  rl: readline.Interface | null = null;
  lockFile: string;
  agent: Agent;
  configs: Record<string, any> = {
    apiKey: API_KEY,
    provider: PROVIDER,
    model: MODEL,
  };

  constructor() {
    this.lockFile = path.join(__dirname, ".chat_terminal_lock");
    this.agent = new Agent();
    this.agent.setLockFilePath(this.lockFile);
    // Ensure configs are set before proceeding
    this.checkOrInitConfigsSync();
    const adapter = new (require("./LLM/adapters/OpenAI").OpenAIAdapter)(
      this.configs.apiKey,
      this.configs.model
    );
    console.log("Adapter initialized with API_KEY:", this.configs.apiKey);
    this.agent.setAdapter(adapter);
  }

  checkOrInitConfigsSync() {
    // Synchronous wrapper for constructor (since constructors can't be async)
    if (this.configs.apiKey && this.configs.apiKey !== "") return;
    const readlineSync = require("readline-sync");
    console.log("No API_KEY found. Initiating setup...");
    const apiKey = readlineSync.question("Enter your OpenAI API Key: ");
    const provider =
      readlineSync.question("Enter provider (default: openai): ", {
        defaultInput: "openai",
      }) || "openai";
    let model = "gpt-4o-mini";
    if ((provider as keyof typeof supportedModels) in supportedModels) {
      const models = supportedModels[provider as keyof typeof supportedModels];
      const index = readlineSync.keyInSelect(
        models,
        `Select a model for provider '${provider}':`,
        { cancel: false }
      );
      model = models[index];
    } else {
      model =
        readlineSync.question("Enter model (default: gpt-4o-mini): ", {
          defaultInput: "gpt-4o-mini",
        }) || "gpt-4o-mini";
    }
    // Save to .env in package root, next to package.json
    const envPath = path.resolve(__dirname, "..", "..", ".env");
    let envContent = "";
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf8");
    }
    envContent = envContent
      .replace(/^API_KEY=.*$/m, "")
      .replace(/^PROVIDER=.*$/m, "")
      .replace(/^MODEL=.*$/m, "");
    envContent += `\nAPI_KEY=${apiKey.trim()}\nPROVIDER=${provider.trim()}\nMODEL=${model.trim()}`;
    fs.writeFileSync(envPath, envContent.trim() + "\n", "utf8");
    this.configs.apiKey = apiKey.trim();
    this.configs.provider = provider.trim();
    this.configs.model = model.trim();
    process.env.API_KEY = this.configs.apiKey;
    process.env.PROVIDER = this.configs.provider;
    process.env.MODEL = this.configs.model;
    console.log("Config saved to .env");
  }

  getConfigs() {
    return this.configs;
  }

  verifyConfigs() {
    if (!this.configs.apiKey) {
      throw new Error("API_KEY is not set in the environment variables.");
    }
    if (!this.configs.provider) {
      throw new Error("PROVIDER is not set in the environment variables.");
    }
    console.log("Configuration verified:", this.configs);
  }

  shouldLaunchNewTerminal() {
    return false; // Default to false, will be overridden by checks below
    if (fs.existsSync(this.lockFile)) {
      console.log("Lock file exists, running in chat mode");
      return false;
    }
    if (process.env.CHAT_EXTERNAL === "1") {
      console.log("CHAT_EXTERNAL is set, running in chat mode");
      return false;
    }
    console.log("Need to launch new terminal");
    return true;
  }

  launch() {
    if (this.shouldLaunchNewTerminal()) {
      this.launchNewTerminal();
    } else {
      this.startChatMode();
    }
  }

  launchNewTerminal() {
    console.log("Launching new terminal...");
    const relativePath = "./dist/main.js";
    if (!fs.existsSync(relativePath)) {
      console.error(
        `Cannot find ${relativePath}. Make sure to compile main.ts first.`
      );
      process.exit(1);
    }
    fs.writeFileSync(this.lockFile, "running", "utf8");
    const platform = os.platform();
    let launchCmd = "";
    if (platform === "darwin") {
      launchCmd = `osascript -e 'tell application "Terminal" to do script "cd \\\"${process.cwd()}\\\" && CHAT_EXTERNAL=1 node \\\"${relativePath}\\\""'`;
    } else if (platform === "win32") {
      launchCmd = `start cmd.exe /k "cd /d "${process.cwd()}" && set CHAT_EXTERNAL=1 && node .\\dist\\main.js"`;
    } else {
      launchCmd = `gnome-terminal -- bash -c "cd \\\"${process.cwd()}\\\" && export CHAT_EXTERNAL=1 && node \\\"${relativePath}\\\"; exec bash"`;
    }
    exec(launchCmd, (err) => {
      if (err) {
        console.error("Failed to launch external terminal:", err);
        if (fs.existsSync(this.lockFile)) {
          fs.unlinkSync(this.lockFile);
        }
        process.exit(1);
      } else {
        console.log("Launched in external terminal. This process will exit.");
        process.exit(0);
      }
    });
  }

  startChatMode() {
    console.log("Starting chat application...");
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: "You> ",
    });
    console.log('Chat started. Type your message or "bye" to exit.');
    this.rl.prompt();
    this.rl.on("line", async (line: string) => {
      try {
        const input = line.trim();
        switch (input.toLowerCase()) {
          case "help":
            console.log(`Clyph> Available commands:
              - 'bye' or 'exit': Exit the chat.
              - 'clear': Clear the terminal screen.
              - 'configs': Show current configurations.
              - 'models': Show available models for the current provider.
              - 'set <key> <value>': Set a configuration key to a value.
              - 'get <key>': Get the value of a configuration key.
              - 'chat': Start a new chat session.
              - 'launch': Launch a new terminal with the chat application.
              - 'help': Show this help message.`);
            this.rl!.prompt();
            break;
          case "bye":
            console.log("Clyph> Goodbye!");
            this.rl!.close();
            break;
          case "exit":
            console.log("Clyph> Exiting chat mode.");
            this.rl!.close();
            break;
          case "clear":
            console.clear();
            this.rl!.prompt();
            break;
          case "configs":
            console.log("Clyph> Current configurations:", this.getConfigs());
            this.rl!.prompt();
            break;
          case "models":
            console.log(
              `Clyph> Available models for provider '${this.configs.provider}':`,
              (supportedModels as any)?.[this.configs.provider]
            );
            this.rl!.prompt();
            break;
          case "set":
            const keys = Object.keys(this.configs);
            console.log("Available configs: " + keys.join(", "));
            this.rl!.question("Enter key to set: ", (key) => {
              if (!keys.includes(key)) {
                console.log(`Clyph> Invalid key '${key}'.`);
                this.rl!.prompt();
                return;
              }
              this.rl!.question(`Enter value for ${key}: `, (value) => {
                if (!value) {
                  console.log(`Clyph> Value for ${key} cannot be empty.`);
                  this.rl!.prompt();
                  return;
                }
                if (this.configs[key] === value) {
                  console.log(`Clyph> ${key} is already set to ${value}.`);
                  this.rl!.prompt();
                  return;
                }
                if (key === "provider") {
                  if (!(value in supportedModels)) {
                    console.log(`Clyph> Invalid provider '${value}'.`);
                    console.log(
                      `Clyph> Supported providers: \n${Object.keys(
                        supportedModels
                      )
                        .map((k) => `  - ${k}`)
                        .join("\n")}`
                    );
                    this.rl!.prompt();
                    return;
                  }
                }
                if (
                  key === "model" &&
                  !(supportedModels as any)?.[this.configs.provider].includes(
                    value
                  )
                ) {
                  console.log(
                    `Clyph> Invalid model '${value}' for provider '${this.configs.provider}'.`
                  );
                  console.log(
                    `Clyph> Supported models: \n${(supportedModels as any)?.[
                      this.configs.provider
                    ]
                      .map((k: string) => `  - ${k}`)
                      .join("\n")}`
                  );
                  this.rl!.prompt();
                  return;
                }
                this.configs[key] = value;
                process.env[key.toUpperCase()] = value;
                // Update .env file
                // const envPath = path.join(process.cwd(), ".env");
                const envPath = path.resolve(__dirname, "..", "..", ".env");
                let envContent = fs.existsSync(envPath)
                  ? fs.readFileSync(envPath, "utf8")
                  : "";
                envContent = envContent.replace(
                  new RegExp(`^${key.toUpperCase()}=.*$`, "mg"),
                  ""
                );
                envContent += `${key.toUpperCase()}=${value}`;
                fs.writeFileSync(envPath, envContent.trim(), "utf8");
                console.log(`Clyph> Set ${key} to ${value}`);
                if (["apiKey", "model", "provider"].includes(key)) {
                  try {
                    this.agent.setAdapter(
                      new (require("./LLM/adapters/OpenAI").OpenAIAdapter)(
                        this.configs.apiKey,
                        this.configs.model
                      )
                    );
                  } catch (adapterErr) {
                    console.error("Clyph> Error updating adapter:", adapterErr);
                  }
                }
                this.rl!.prompt();
              });
            });
            break;
          case "get": {
            const keys = Object.keys(this.configs);
            console.log("Available configs: " + keys.join(", "));
            this.rl!.question("Enter key to get: ", (key) => {
              if (!keys.includes(key)) {
                console.log(`Clyph> Invalid key '${key}'.`);
              } else {
                console.log(`Clyph> ${key}: ${this.configs[key]}`);
              }
              this.rl!.prompt();
              return;
            });
          }
          break;
        //   case "reset":
        //     this.configs = {
        //       apiKey: API_KEY,
        //       provider: PROVIDER,
        //       model: MODEL,
        //     };
        //     console.log("Clyph> Configurations reset to default.");
        //     // Update environment variables
        //     process.env.API_KEY = API_KEY;
        //     process.env.PROVIDER = PROVIDER;
        //     process.env.MODEL = MODEL;
        //     this.agent.setAdapter(
        //       new (require("./LLM/adapters/OpenAI").OpenAIAdapter)(
        //         this.configs.apiKey,
        //         this.configs.model
        //       )
        //     );
        //     this.rl!.prompt();
        //     break;
          case "chat":
            console.log("Clyph> Starting a new chat session...");
            this.agent.setAdapter(
              new (require("./LLM/adapters/OpenAI").OpenAIAdapter)(
                this.configs.apiKey,
                this.configs.model
              )
            );
            await this.agent.streamLLMResponse(input);
            console.log("\n");
            this.rl!.prompt();
            break;
          case "launch":
            console.log("Clyph> Launching a new terminal...");
            this.launchNewTerminal();
            this.rl!.prompt();
            break;
          default:
            console.log(`Clyph> ${input}`);
            await this.agent.streamLLMResponse(input);
        }
      } catch (err) {
        console.error("Clyph> Error:", err);
      } finally {
        if (this.rl) this.rl.prompt();
      }
    });
    this.rl.on("close", () => {
      console.log("\nChat ended.");
      if (fs.existsSync(this.lockFile)) {
        fs.unlinkSync(this.lockFile);
      }
      process.exit(0);
    });
  }
}
