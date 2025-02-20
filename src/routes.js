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
    let categoryName = req.params.category;

    categoryName = categoryName.replace(/-/g, ' ');

    try {
        const db = getDatabase();

        const categoryResult = await db.query('SELECT id FROM categories WHERE LOWER(name) = LOWER($1)', [categoryName]);

        if (!categoryResult || categoryResult.rowCount === 0) {
            console.error(`❌ Category "${categoryName}" not found.`);
            return res.status(404).send("Category not found.");
        }

        const categoryId = categoryResult.rows[0].id;

        const questionsResult = await db.query('SELECT question, answers FROM questions WHERE category_id = $1', [categoryId]);
        const questions = questionsResult.rows;

        if (!questions || questions.length === 0) {
            console.warn(`⚠️ No questions found for category "${categoryName}"`);
        }

        res.render('category', { title: categoryName, questions });

    } catch (error) {
        console.error("❌ Error loading category:", error);
        res.status(500).send("Villa við að birta flokk.");
    }
});



router.get('/form', (req, res) => {
    res.render('form', { title: 'Búa til flokk' });
});


// aðstoð frá GPT í þessum kóða !
router.post('/form', async (req, res) => {
    const { title, questions } = req.body;

    if (!title || !questions || questions.length === 0) {
        return res.status(400).send("Titill og spurningar eru nauðsynlegar.");
    }

    try {
        const db = getDatabase();

        let categoryResult = await db.query(
            'INSERT INTO categories (name) VALUES ($1) RETURNING id',
            [title]
        );
        const categoryId = categoryResult.rows[0].id;

        for (const questionObj of questions) {
            const { question, answers } = questionObj;
            if (!question || !answers || answers.length < 2) {
                console.error("Spurning þarf að hafa að minnsta kosti 2 svör.");
                continue;
            }

            let questionResult = await db.query(
                'INSERT INTO questions (category_id, question, answers) VALUES ($1, $2, $3) RETURNING id',
                [categoryId, question, JSON.stringify(answers)]
            );
            console.log(`Spurning sett í gögn: ${question}`);
        }

        res.render('form-created', { title: 'Flokkur búinn til' });
    } catch (error) {
        console.error("Error inserting form data:", error);
        res.status(500).send("Villa kom upp við að vista spurningalistann.");
    }
});
