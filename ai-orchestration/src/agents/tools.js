import axios from "axios";
import {tool} from "langchain";
import * as z from "zod";

export const listFiles = tool(
    async ({paths: []}) => {

        console.log("===================================================")
        console.log("using list files tool")
        console.log("===================================================")

        const response = await axios.post("http://019e41c5-2bd9-713b-aff8-4c474c088de6.agent.localhost/list-files");

        console.log("===================================================")
        console.log("response from the list files tool", response.data)
        console.log("===================================================")

        return JSON.stringify(response.data.files);
    },
    {
        name: "list_files",
        description: "List files in the project directory. This is useful for understanding the project structure and finding relevant files for code generation or modification. The tool returns a list of file paths relative to the project root.",
        schema: z.object({})
    }
)

export const readFiles = tool(
    async ({ files: [] }) => {

        console.log("===================================================")
        console.log("using read files tool")
        console.log("===================================================")

        const response = await axios.post("http://019e41c5-2bd9-713b-aff8-4c474c088de6.agent.localhost/read-file?files=" + files.join(","));
        
        console.log("===================================================")
        console.log("response from the read files tool", response.data)
        console.log("===================================================")

        return JSON.stringify(response.data);
    },
    {
        name: "read_file",
        description: "Read the contents of one or more files. This is useful for understanding the existing codebase, extracting information, or using it as context for code generation. The tool takes a list of file paths (relative to the project root) and returns their contents.",
        schema: z.object({
            files: z.array(z.string()).describe("A list of file paths to read, relative to the project root. These should be files that were listed using the list_files tool or created later.")
        })
    }
)

export const updateFiles = tool(
    async ({ files }) => {

        console.log("===================================================")
        console.log("using update files tool")
        console.log("===================================================")

        const response = await axios.patch("http://019e41c5-2bd9-713b-aff8-4c474c088de6.agent.localhost/update-files",{
            updates: files
        })

        console.log("===================================================")
        console.log("response from the update files tool", response.data)
        console.log("===================================================")

        return JSON.stringify(response.data.results);
    },
    {
        name: "update_file",
        description: "Update the contents of one or more files. This is useful for modifying the codebase, fixing bugs, or implementing new features. The tool takes a list of updates, where each update includes a file path (relative to the project root) and the new content for that file. The tool returns the results of the update operation, which may include success status or error messages. This tool can also be used to create files that do not exist yet by providing a new file path and content.",
        schema: z.object({
            files: z.string().describe("The absolute path of the file to update."),
            content: z.string().describe("The new content to write to the file.")
        }).describe("The list of files to be updated")
    }
)