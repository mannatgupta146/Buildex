import {ChatMistralAI} from "@langchain/mistralai"
import {listFiles, readFiles, updateFiles} from "./tools.js";
import { createAgent } from "langchain";
import dotenv from 'dotenv';

dotenv.config();

const model = new ChatMistralAI({
    model: "mistral-medium-latest",
    apiKey: process.env.MISTRAL_API_KEY
})

const agent = createAgent({
    model,
    tools: [listFiles, readFiles, updateFiles]
})

await agent.invoke({
    messages: [
        {
            role: "user",
            content: "update the theme of the project to dark "
        }
    ]
})