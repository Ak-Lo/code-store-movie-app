import axios from 'axios';
import PDFDocument from 'pdfkit';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const API_KEY = process.env.TMDB_API_KEY;

if (!API_KEY) {
    throw new Error('TMDB_API_KEY environment variable is not defined.');
}

const baseURL = 'https://api.themoviedb.org/3';
const popularMoviesURL = `${baseURL}/movie/popular?api_key=${API_KEY}`;
const movieURL = (movieId: string) => `${baseURL}/movie/${movieId}?api_key=${API_KEY}`;

const downloadImage = async (imageUrl: string, fileName: string): Promise<void> => {
    const response = await axios.get(imageUrl, { responseType: 'stream' });
    const writer = fs.createWriteStream(fileName);
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
};


export const getMovies = async (): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        axios.get(popularMoviesURL)
            .then(response => {
                const movies = response.data.results;
                const doc = new PDFDocument();
                const buffers: Buffer[] = [];

                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => {
                    const pdfBuffer = Buffer.concat(buffers);
                    resolve(pdfBuffer);
                });

                doc.text('Popular Movies\n\n');

                movies.forEach((movie: any) => {
                    doc.text(`${movie.title}`);
                    doc.text(`Release Date: ${movie.release_date}`);
                    doc.text(`Vote Average: ${movie.vote_average}`);
                    doc.text('\n\n');
                });

                doc.end();
            })
            .catch(error => {
                reject(error);
            });
    });
};

export const getMovieById = async (movieId: string): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        axios.get(movieURL(movieId))
            .then(async response => {
                const movie = response.data;
                console.log(movie)
                const doc = new PDFDocument();
                const buffers: Buffer[] = [];
                const imagePath = `poster_${movieId}.jpg`;

                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => {
                    const pdfBuffer = Buffer.concat(buffers);
                    resolve(pdfBuffer);
                });

                doc.text(`${movie.title}\n\n`);
                doc.text(`Release Date: ${movie.release_date}`);
                doc.text(`Vote Average: ${movie.vote_average}`);
                // doc.image(`https://image.tmdb.org/t/p/w500/${movie.poster_path}`,{ width: 200 });
                try {
                    await downloadImage(`https://image.tmdb.org/t/p/w500/${movie.poster_path}`, imagePath);
                    doc.image(imagePath, { width: 200 });

                    //////////// removing downloaded image after creating PDF//////////////
                    fs.unlink(imagePath, (error) => {
                        if (error) {
                            console.error('Error deleting image:', error);
                        } else {
                            console.log('Image deleted successfully');
                        }
                    });
                } catch (error) {
                    console.error('Error downloading or embedding image:', error);
                }

                doc.end();
            })
            .catch(error => {
                reject(error);
            });
    });
};
