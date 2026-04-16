import {
  streamText,
  tool,
  convertToModelMessages,
  stepCountIs,
  type UIMessage,
} from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { pool } from '@/lib/db';

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openai('gpt-4o'),
    stopWhen: stepCountIs(5),
    system: `You are a competitor-analysis SQL assistant with access to a PostgreSQL database.

        CRITICAL RULES:
        1. ALWAYS call 'query_postgres' FIRST before answering any question about competitors, platforms, products, plans, features, pricing, advantages, disadvantages, or uploaded report data.
        2. Base your answer EXCLUSIVELY on the rows returned by the tool. Do NOT use your own training knowledge.
        3. If the tool returns { found: false } or 0 rows, respond with ONLY:
            "I don't have any data about that in our database. Try asking about a competitor we've analyzed."
            Do NOT guess, infer, or use your training knowledge as a fallback.
        4. Quote or reference specific values from the returned rows in your answer.
        5. Write efficient PostgreSQL SELECT queries. NEVER write INSERT, UPDATE, DROP, or DELETE.
        6. Use ILIKE for case-insensitive text searches, and use %term% partial matching when users may mention a shortened name, plan name, or keyword.
        7. Reply in the same language the user uses (Usually answer either english or indonesian).
        8. For comparison or discovery questions, prefer OR-based matching across competitor_name, feature_name, price, advantages, disadvantages, and pdf_name.
        9. Use AND only when the user explicitly requires multiple conditions at the same time.

        The table 'competitor_analysis' schema:
        - id (SERIAL PRIMARY KEY)
        - competitor_name (VARCHAR)
        - feature_name (VARCHAR)
        - price (VARCHAR)
        - advantages (TEXT)
        - disadvantages (TEXT)
        - pdf_name (VARCHAR)

        Common row patterns in this table:
        - competitor capability rows
        - plan/tier pricing rows
        - usage or participant limit rows
        - explicit advantages or disadvantages from uploaded reports

        For comparison questions, query the descriptive columns together, for example:
        SELECT competitor_name, feature_name, price, advantages, disadvantages, pdf_name
        FROM competitor_analysis
        WHERE competitor_name ILIKE '%zoom%' OR feature_name ILIKE '%recording%';
        `,
    messages: await convertToModelMessages(messages),
    tools: {
      query_postgres: tool({
        description:
          'Execute a raw SQL SELECT query to retrieve data from the competitor_analysis table.',
        inputSchema: z.object({
          query: z
            .string()
            .describe('The raw PostgreSQL SELECT query to execute.'),
        }),
        execute: async ({ query }) => {
          console.log('\n🤖 AI is running SQL:', query);

          if (!query.trim().toLowerCase().startsWith('select')) {
            return {
              error: 'Security Exception: Only SELECT queries are permitted.',
            };
          }

          try {
            const { rows } = await pool.query(query);
            console.log(`✅ Query returned ${rows.length} rows.`);
            console.log('📦 Data returned:', JSON.stringify(rows, null, 2)); // ADD THIS

            if (rows.length === 0) {
              return { found: false, rows: [] };
            }

            return rows as Record<string, unknown>[];
          } catch (error) {
            console.error('❌ SQL Error:', error);
            return { error: (error as Error).message };
          }
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
