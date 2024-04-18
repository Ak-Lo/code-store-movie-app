import express, { Request, Response } from 'express';
import { getMovies, getMovieById } from './movies';


const app = express();
const PORT = process.env.PORT;

app.get('/movies', async (req: Request, res: Response) => {
    try {
        const pdfBuffer = await getMovies();
        res.set('Content-Type', 'application/pdf');
        res.send(pdfBuffer);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/movies/:id', async (req: Request, res: Response) => {
    const movieId = req.params.id;
    // console.log(movieId)
    try {
        const pdfBuffer = await getMovieById(movieId);
        res.set('Content-Type', 'application/pdf');
        res.send(pdfBuffer);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is up and running on port ${PORT}`);
});
