#!/usr/bin/env node

import { Process } from './classes/Process';


if (require.main === module) {
    const proc = new Process();
    proc.launch();
}