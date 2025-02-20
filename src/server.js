import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { router } from './routes.js';
import bodyParser from 'body-parser';

const app = express();

const port = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));


app.use(express.urlencoded({ extended: true }));
app.use('/', router);

app.use((req, res) => {
  res.status(404).render('404', { title: 'Þessi síða fannst ekki' })
})

const hostname = '127.0.0.1';

app.listen(port, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
