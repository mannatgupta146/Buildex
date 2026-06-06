import mongoose from "mongoose"

const projectSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId, 
        required: true 
    },
    title: {
        type: String,
        default: "Untitled Project",
    },
})

const projectModel = mongoose.model("projects", projectSchema)

export default projectModel