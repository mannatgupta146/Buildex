import express from 'express';
import morgan from 'morgan';
import fs from 'fs';

const app = express();

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const WORKSPACE_DIR = '/workspace';

app.get('/api/agent/health', (req, res) => {
    res.status(200).json({
        message: 'Sandbox agent API is healthy',
        status: 'ok'
    });
});

app.get('/list-files', async (req, res) => {
    const elements = await fs.promises.readdir(WORKSPACE_DIR);
    res.status(200).json({ 
        message: 'Elements in working directory',
        elements
    });


})

export default app;