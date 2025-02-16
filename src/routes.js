import express from 'express';
import { getDatabase } from './lib/db.client.js';
import { environment } from './lib/environment.js';
import { logger } from './lib/logger.js';
import fs from 'fs'
import path from 'path';

export const router = express.Router();

router.get('/', async (req, res) => {
    const result = await getDatabase()?.query('SELECT * FROM categories');

    const categories = result?.rows ?? [];

    console.log(categories);
    res.render('index', { title: 'Forsíða', categories });
});

router.get('/spurningar/:category', async (req, res) => {
    const categoryName = req.params.category.toLowerCase();

    try {
        const db = getDatabase();

        // ✅ Get category ID
        const categoryResult = await db.query('SELECT id FROM categories WHERE LOWER(name) = LOWER($1)', [categoryName]);
        if (categoryResult.rowCount === 0) {
            return res.status(404).send("Category not found.");
        }
        const categoryId = categoryResult.rows[0].id;

        // ✅ Get questions for the category
        const questionsResult = await db.query('SELECT question, answers FROM questions WHERE category_id = $1', [categoryId]);
        const questions = questionsResult.rows;

        res.render('category', { title: categoryName, questions });

    } catch (error) {
        console.error("Error loading category data:", error);
        res.status(500).send("Error loading category data.");
    }
});


router.get('/form', (req, res) => {
    res.render('form', { title: 'Búa til flokk' });
});

router.post('/form', async (req, res) => {
    const { name } = req.body;

    console.log(name);

    // Hér þarf að setja upp validation, hvað ef name er tómt? hvað ef það er allt handritið að BEE MOVIE?
    // Hvað ef það er SQL INJECTION? HVAÐ EF ÞAÐ ER EITTHVAÐ ANNAÐ HRÆÐILEGT?!?!?!?!?!
    // TODO VALIDATION OG HUGA AÐ ÖRYGGI

    // Ef validation klikkar, senda skilaboð um það á notanda

    // Ef allt OK, búa til í gagnagrunn.
    const env = environment(process.env, logger);
    if (!env) {
        process.exit(1);
    }

    const db = getDatabase();

    const result = await db?.query('INSERT INTO categories (name) VALUES ($1)', [
        name,
    ]);

    console.log(result);

    res.render('form-created', { title: 'Flokkur búinn til' });
});