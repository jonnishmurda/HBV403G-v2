import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { getDatabase } from './lib/db.client.js';

const jsonFiles = ['html.json', 'css.json', 'js.json'];

async function importQuestions() {
    const db = getDatabase();
    if (!db) {
        console.error("❌ Database connection failed");
        process.exit(1);
    }

    try {
        for (const fileName of jsonFiles) {
            const filePath = path.join(process.cwd(), 'data', fileName);
            const rawData = await fs.readFile(filePath, 'utf-8');
            const jsonData = JSON.parse(rawData);
            const categoryName = jsonData.title.trim();

            let categoryResult = await db.query('SELECT id FROM categories WHERE LOWER(name) = LOWER($1)', [categoryName]);
            let categoryId;

            if (categoryResult.rowCount === 0) {
                console.warn(`⚠️ Category "${categoryName}" not found. Skipping questions.`);
                continue;
            } else {
                categoryId = categoryResult.rows[0].id;
                console.log(`✅ Using existing category: ${categoryName} (ID: ${categoryId})`);
            }

            // ✅ Insert Questions
            for (const questionObj of jsonData.questions) {
                if (!questionObj.question || !Array.isArray(questionObj.answers)) {
                    console.warn('⚠️ Skipping invalid question:', questionObj);
                    continue;
                }

                const insertQuestion = await db.query(
                    'INSERT INTO questions (category_id, question, answers) VALUES ($1, $2, $3) RETURNING id',
                    [categoryId, questionObj.question, JSON.stringify(questionObj.answers)]
                );
                console.log(`✅ Inserted question: ${questionObj.question} (ID: ${insertQuestion.rows[0].id})`);
            }
        }

        console.log("🎉 Import successful!");
    } catch (error) {
        console.error("❌ Error importing data:", error);
    } finally {
        await db.end();
    }
}

importQuestions();
