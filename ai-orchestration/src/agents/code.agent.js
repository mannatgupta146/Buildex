import "dotenv/config";
import { ChatMistralAI } from "@langchain/mistralai";
import { createAgent } from "langchain";

import {
    listFiles,
    readFiles,
    updateFiles
} from "./tools.js";

const model = new ChatMistralAI({
    model: "mistral-medium-latest",
    apiKey: process.env.MISTRALAI_API_KEY,
    temperature: 0.35,
});

const agent = createAgent({
    model,

    tools: [
        listFiles,
        readFiles,
        updateFiles
    ],

    systemPrompt: `
You are a senior software engineer.

Always:
1. Inspect project
2. Read before edit
3. Update minimally
4. Validate before finish

If user request is vague:
- infer requirements
- create production-grade implementation
- avoid unnecessary files

Stop once goal is completed.
Do not repeatedly call tools.
`,

    config: {
        recursionLimit: 100
    }
});

export default agent;