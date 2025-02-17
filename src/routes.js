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
    try {
        const { title, questions } = req.body;

        if (!title || !questions || Object.keys(questions).length === 0) {
            throw new Error("Titill og að minnsta kosti ein spurning eru nauðsynleg.");
        }

        const db = getDatabase();
        if (!db) {
            return res.status(500).send("Database connection failed.");
        }

        // Insert category
        const categoryResult = await db.query(
            'INSERT INTO categories (name) VALUES ($1) RETURNING id',
            [title]
        );

        if (!categoryResult || !categoryResult.rows || categoryResult.rows.length === 0) {
            throw new Error("Failed to insert category into the database.");
        }

        const categoryId = categoryResult.rows[0].id;

        // Insert questions
        for (const qKey in questions) {
            const question = questions[qKey];

            const questionResult = await db.query(
                'INSERT INTO questions (category_id, question) VALUES ($1, $2) RETURNING id',
                [categoryId, question.question]
            );

            if (!questionResult || !questionResult.rows || questionResult.rows.length === 0) {
                throw new Error(`Failed to insert question: ${question.question}`);
            }

            const questionId = questionResult.rows[0].id;

            // Insert answers
            if (!question.answers || Object.keys(question.answers).length < 2) {
                throw new Error(`Spurning '${question.question}' þarf að hafa að minnsta kosti 2 svör.`);
            }

            for (const aKey in question.answers) {
                const answer = question.answers[aKey];

                await db.query(
                    'INSERT INTO answers (question_id, answer, correct) VALUES ($1, $2, $3)',
                    [questionId, answer.answer, answer.correct === "true"]
                );
            }
        }

        res.render('form-created', { title: 'Flokkur búinn til' });

    } catch (error) {
        console.error("🚨 Error inserting quiz data:", error);
        res.status(400).send(error.message);
    }
});
