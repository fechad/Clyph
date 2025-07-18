import { exec } from 'child_process';
import * as readline from 'readline';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { PORT } from './utils/env';
// import { ChatOpenAI } from 'langchain/chat_models/openai';
// import { OpenAIEmbeddings } from 'langchain/embeddings/openai';

console.log('PORT is set to:', PORT);
// Create a simple lock file mechanism
const lockFile = path.join(__dirname, '.chat_terminal_lock');

// Debug logs
console.log(`Current directory: ${__dirname}`);
console.log(`CHAT_EXTERNAL: ${process.env.CHAT_EXTERNAL}`);
console.log(`Lock file exists: ${fs.existsSync(lockFile)}`);




function shouldLaunchNewTerminal() {
    if (fs.existsSync(lockFile)) {
        console.log('Lock file exists, running in chat mode');
        return false;
    }

    if (process.env.CHAT_EXTERNAL === '1') {
        console.log('CHAT_EXTERNAL is set, running in chat mode');
        return false;
    }

    console.log('Need to launch new terminal');
    return true;
}

// Main program flow
if (shouldLaunchNewTerminal()) {
    console.log('Launching new terminal...');

    const relativePath = './dist/chat.js';

    if (!fs.existsSync(relativePath)) {
        console.error(`Cannot find ${relativePath}. Make sure to compile chat.ts first.`);
        process.exit(1);
    }

    fs.writeFileSync(lockFile, 'running', 'utf8');

    const platform = os.platform();
    let launchCmd = '';

    if (platform === 'darwin') {
        // macOS
        launchCmd = `osascript -e 'tell application "Terminal" to do script "cd \\"${process.cwd()}\\" && CHAT_EXTERNAL=1 node \\"${relativePath}\\""'`;
    } else if (platform === 'win32') {
        // Windows
        launchCmd = `start cmd.exe /k "cd /d "${process.cwd()}" && set CHAT_EXTERNAL=1 && node .\\dist\\chat.js"`;
    } else {
        // Linux/Unix
        launchCmd = `gnome-terminal -- bash -c "cd \\"${process.cwd()}\\" && export CHAT_EXTERNAL=1 && node \\"${relativePath}\\"; exec bash"`;
    }

    exec(launchCmd, (err) => {
        if (err) {
            console.error('Failed to launch external terminal:', err);
            if (fs.existsSync(lockFile)) {
                fs.unlinkSync(lockFile);
            }
            process.exit(1);
        } else {
            console.log('Launched in external terminal. This process will exit.');
            process.exit(0);
        }
    });
} else {
    // ----- CHAT MODE -----
    console.log('Starting chat application...');

    // Mock LLM function that simulates streaming response
    async function* mockLLMStream(query: string): AsyncGenerator<string> {
        const chunks = [`Bot> Responding to "${query}"...\n`, 'Chunk 1...\n', 'Chunk 2...\n'];
        for (const chunk of chunks) {
            await new Promise((res) => setTimeout(res, 400));
            yield chunk;
        }
    }

    // Function to stream the LLM response to the terminal
    async function streamLLMResponse(query: string) {
        const stream = await mockLLMStream(query); // Replace with chain.stream({ query })
        for await (const chunk of stream) {
            process.stdout.write(chunk);
        }
        rl.prompt();
    }

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: 'You> ',
    });

    console.log('Chat started. Type your message or "bye" to exit.');
    rl.prompt();

    rl.on('line', async (line: string) => {
        const input = line.trim();
        if (input.toLowerCase() === 'bye') {
            console.log('Bot> Goodbye!');
            rl.close();
            return;
        }

        await streamLLMResponse(input);
    });

    rl.on('close', () => {
        console.log('\nChat ended.');
        if (fs.existsSync(lockFile)) {
            fs.unlinkSync(lockFile);
        }
        process.exit(0);
    });
}