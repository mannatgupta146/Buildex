import axios from "axios";
import { tool } from "langchain";
import * as z from "zod";

const BASE_URL =
    "http:/sandbox-service-019e551e-5b2d-7368-b5df-0d232ed9fefd:3000";

export const listFiles = tool(
    async () => {
        try {
            console.log("=================================");
            console.log("using list files tool");
            console.log("=================================");

            const response =
                await axios.get(`${BASE_URL}/list-files`);

            return JSON.stringify(
                response.data.files ?? []
            );

        } catch (error) {
            throw new Error(
                `list_files failed: ${
                    error.response?.data ||
                    error.message
                }`
            );
        }
    },

    {
        name: "list_files",

        description:
            "List project files.",

        schema: z.object({})
    }
);

export const readFiles = tool(
    async ({ files }) => {
        try {
            console.log("=================================");
            console.log("using read files tool", files);
            console.log("=================================");

            if (!files?.length) {
                throw new Error(
                    "files array cannot be empty"
                );
            }

            const response =
                await axios.get(
                    `${BASE_URL}/read-files`,
                    {
                        params: {
                            files: files.join(",")
                        }
                    }
                );

            return JSON.stringify(
                response.data
            );

        } catch (error) {
            throw new Error(
                `read_files failed: ${
                    error.response?.data ||
                    error.message
                }`
            );
        }
    },

    {
        name: "read_files",

        description:
            "Read contents of provided files.",

        schema: z.object({
            files: z
                .array(z.string())
                .min(1)
        })
    }
);

export const updateFiles = tool(
    async ({ files }) => {
        try {
            console.log("=================================");
            console.log("using update files", files);
            console.log("=================================");

            const response =
                await axios.patch(
                    `${BASE_URL}/update-files`,
                    {
                        updates: files
                    }
                );

            return JSON.stringify(
                response.data.results
            );

        } catch (error) {
            throw new Error(
                `update_files failed: ${
                    error.response?.data ||
                    error.message
                }`
            );
        }
    },

    {
        name: "update_files",

        description:
            "Update or create files.",

        schema: z.object({
            files: z
                .array(
                    z.object({
                        file: z.string(),

                        content:
                            z.string()
                    })
                )
                .min(1)
        })
    }
);