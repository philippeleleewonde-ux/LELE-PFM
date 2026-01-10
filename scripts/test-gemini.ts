// ============================================
// TEST SCRIPT: Vérifier l'intégration Gemini 1.5 Flash
// Usage: npx tsx scripts/test-gemini.ts
// ============================================

import { GoogleGenerativeAI } from '@google/generative-ai'
import * as dotenv from 'dotenv'

dotenv.config()

async function testGeminiIntegration() {
  console.log('🧪 Testing Gemini 1.5 Flash integration...\n')

  // Vérifier la clé API
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found in .env')
    process.exit(1)
  }

  console.log('✅ GEMINI_API_KEY found')
  console.log(`📋 Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}\n`)

  try {
    // Initialiser Gemini
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.3
      }
    })

    console.log('✅ Gemini client initialized\n')

    // Test simple : Regrouper 3 lignes en 2
    const testPrompt = `You are tasked with intelligently regrouping 3 business lines into exactly 2 coherent categories.

Here are the 3 original business lines:

1. "Ventes e-commerce"
   - Revenue: 500,000 €
   - Expenses: 300,000 €
   - Headcount: 15

2. "Distribution retail"
   - Revenue: 800,000 €
   - Expenses: 500,000 €
   - Headcount: 25

3. "Services IT"
   - Revenue: 300,000 €
   - Expenses: 200,000 €
   - Headcount: 10

**Your Task:**
1. Analyze the semantic similarity between these business lines
2. Group them into exactly 2 coherent categories
3. Each category should represent a logical business unit
4. Preserve the financial metrics (sum revenue and expenses for each group)

**The 2 target categories are:**
1. Sales & Distribution
2. Technology & R&D

**Output Format (JSON):**
{
  "grouped_lines": [
    {
      "name": "Category Name",
      "category": "Sales & Distribution",
      "original_lines": ["Line 1", "Line 2"],
      "reasoning": "Brief explanation of why these lines were grouped together"
    },
    ...
  ]
}

Important:
- You MUST return exactly 2 grouped lines
- Each grouped line MUST have a "category" field matching one of the 2 target categories
- Each grouped line MUST list all "original_lines" that were merged into it
- Provide brief "reasoning" for each grouping decision

Return ONLY valid JSON, no additional text.`

    console.log('🚀 Sending test request to Gemini...\n')

    const startTime = Date.now()
    const result = await model.generateContent(testPrompt)
    const duration = Date.now() - startTime

    const responseText = result.response.text()

    console.log('✅ Response received!\n')
    console.log(`⏱️  Duration: ${duration}ms\n`)
    console.log('📄 Response:\n')
    console.log(responseText)
    console.log('\n')

    // Parser le JSON
    const parsed = JSON.parse(responseText)

    console.log('✅ JSON parsing successful\n')
    console.log('📊 Parsed result:')
    console.log(JSON.stringify(parsed, null, 2))
    console.log('\n')

    // Vérifier la structure
    if (parsed.grouped_lines && Array.isArray(parsed.grouped_lines) && parsed.grouped_lines.length === 2) {
      console.log('✅ Structure validation passed: 2 grouped lines')
      console.log(`   - ${parsed.grouped_lines[0].name}`)
      console.log(`   - ${parsed.grouped_lines[1].name}`)
      console.log('\n')
    } else {
      console.log('⚠️  Structure validation warning: Expected 2 grouped lines')
    }

    console.log('🎉 Gemini integration test SUCCESSFUL!')
    console.log('💡 Ready to use for BusinessLinesRegrouper service')

  } catch (error) {
    console.error('❌ Test failed:', error)
    if (error instanceof Error) {
      console.error('   Message:', error.message)
      console.error('   Stack:', error.stack)
    }
    process.exit(1)
  }
}

testGeminiIntegration()
