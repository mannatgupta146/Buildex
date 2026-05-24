import axios from "axios";
import { tool } from "langchain";
import * as z from "zod";

export const listFiles = tool(
    async ({}, config) => {
        try {
            console.log("=================================");
            console.log("using list files tool");
            console.log("=================================");

            const writer = config.writer

            const response =
                await axios.get(`http:/sandbox-service-${config.context.projectId}:3000/list-files`);

            writer.write("Files listed successfully.");

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
    async ({ files = [] }, config) => {
        try {
            console.log("=================================");
            console.log("using read files tool", files);
            console.log("=================================");

            const writer = config.writer

            if (!files?.length) {
                throw new Error(
                    "files array cannot be empty"
                );
            }

            const response =
                await axios.get(
                    `http:/sandbox-service-${config.context.projectId}:3000/read-files`,
                    {
                        params: {
                            files: files.join(",")
                        }
                    }
                );

            writer.write("Files read successfully.");

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
    async ({ files }, config ) => {
        try {
            console.log("=================================");
            console.log("using update files", files);
            console.log("=================================");

            const writer = config.writer

            const response =
                await axios.patch(
                    `http:/sandbox-service-${config.context.projectId}:3000/update-files`,
                    {
                        updates: files
                    }
                );

            writer.write("Files updated successfully.");

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