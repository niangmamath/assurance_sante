require('dotenv').config({ path: __dirname + '/.env' });
const OpenAI = require('openai');

async function testAI() {
  try {
    console.log("Loading key:", process.env.OPENAI_API_KEY ? "Key exists (length: " + process.env.OPENAI_API_KEY.length + ")" : "NO KEY FOUND");
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    console.log('Sending request to OpenAI...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Ceci est un test, répondez simplement "test ok".' }],
      max_tokens: 10
    });
    
    console.log('--- SUCCESS ---');
    console.log(completion.choices[0].message.content);
  } catch (error) {
    console.log('--- ERROR ---');
    console.log(error.message);
    if (error.status) console.log('HTTP Status:', error.status);
    if (error.error) console.log('OpenAI details:', JSON.stringify(error.error, null, 2));
  }
}

testAI();
