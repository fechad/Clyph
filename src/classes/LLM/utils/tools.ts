import { exec } from 'child_process';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';


export async function runCommand(command: string): Promise<string> {
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject(`Error executing command: ${error.message}`);
                } else if (stderr) {
                    reject(`Command error: ${stderr}`);
                } else {
                    resolve(stdout.trim());
                }
            });
        });
    }