export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { messages } = req.body;
    const apiKey = process.env.PERPLEXITY_API_KEY;
    
    if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured' });
    }

    const resumeContent =  `SUHAS THAKRAL
📧 [suhas.thakral@whu.edu](mailto:suhas.thakral@whu.edu)
Head of Business Intelligence & AI

PROFESSIONAL SUMMARY
Experienced data leader with a track record of generating business impact through insights and algorithms. Strong team management skills and ability to collaborate across departments. Proficient in AI concepts and applications including prompt engineering, with expertise in driving AI adoption and integrating large language models into BI workflows for automated insights and human-centered data interactions.

CORE COMPETENCIES
AI & Advanced Analytics: AI concepts, Prompt engineering, Large Language Models, "Vibe coding" techniques, Automated insights, RAG, AI Chatbot with vector search, Vector search, Vector Databses, Rerieval Augnemented Generation
Data Technologies: BigQuery, AWS, SQL, Python, Data warehousing, ETL (Fivetran, Stitch Data, DBT, Airflow)
Visualization & BI: Tableau, Looker Studio, QlikSense, Metabase, Dashboard design, Reporting frameworks
CRM & Platforms: Salesforce, Hubspot, Pipedrive, Cloud Functions, Cloud Scheduler, ZeroETL

PROFESSIONAL EXPERIENCE

Head of Business Intelligence | HYGH AG | Apr 2022 - Current Role 
Key Business Impact Achievements:
• Revenue Impact: Built attribution model to attribute revenue to each screen, providing cleaner investor reporting
• Cost Optimization: Analyzed late closers and early shutting shops, built proportional system for fair rent, reducing OPEX by 10%
• Revenue Growth: Negotiated higher CMP with measuring authorities, directly increasing revenue potential by 11%
• AI Innovation: Built AI automation for TEXT to SQL on N*N for simple Salesforce data
• Sales Efficiency: Assisted in quoting tool development with automated offer building, saving sales team ~30 minutes per offer
• Strategic Planning and Business Partnership - Collaborating with senior leadership to define and align the BI department strategy with company goals
• Driving AI adoption and prompt engineering: integrating AI into BI workflows—leveraging large language models for automated insights
• Salesforce Admin and product owner - Custom building apps on Salesforce to bring all systems under one ecosystem
• Reporting and Visualization - Designing and implementing reporting frameworks and dashboards for clients, stakeholders, and investors
• Analysis of revenue data and modeling for forecasting and setting targets
• Design, implementation, and rollout of incentive models
• Managing the master reporting project to make data accessible to all stakeholders
• Training of new hires and mentoring the team to improve data skills on TABLEAU and SQL

Business Intelligence Team Lead | Atheneum | Jan 2020 - Apr 2022 (2 years 10 months)
Key Business Impact Achievements:
• Revenue Growth: Built compensation model based on net revenue, increasing gross revenue by 50%
• Team Building: Expanded data team from 1 person to 8 across Berlin, London, and Lahore
• Strategic Alignment: Worked with upper management to align financial goals with BI for direct measurable impact
• Data Control and Management - Coordinating with engineering and product team to enforce data governance, accuracy, and consistency

Business Intelligence Controller | Atheneum | Jun 2019 - Jan 2020

CRM Manager | SMUNCH | Nov 2018 - Jun 2019 (8 months)
• Data migration and cleaning between CRM systems
• Implementation of sales process and lead research process
• Optimizing sales process using MarketingCloud automation
• Creating reports on Tableau and Salesforce to track new KPIs

Business Intelligence Analyst | Medigo GmbH | Nov 2017 - Nov 2018 (1 year 1 month)
• Automation of controlling tasks using TABLEAU and Zapier
• Creation of dashboards on TABLEAU to visualize data in the most understandable ways
• Analysis of data to find trends of seasonality and calculation of team compensation
• Data extraction and transformation using SQL and various ad-hoc analysis
• CRM Owner and trainer, improving sales processes through data analysis
• Analyzing conversion rates and implementing new technologies for optimization
• Creation of various dashboards using QlikSense for operational and financial KPIs

Consultant | Aon | Jun 2014 - Feb 2015 (9 months)
• Worked as junior analyst in consulting operations with team of 20 analysts and project leads
• Managed team engagement projects in South East Asian and European markets
• Analyzed statistical data and worked on ROI presentations for clients including McDonald's

EDUCATION
Master in Management | WHU – Otto Beisheim School of Management | 2015 - 2017
Master's degree, Business, Management, Marketing | University of South Carolina Darla Moore School of Business | 2016
Bachelor of Arts (B.A.), Economics | Delhi University Hansraj College | 2011 - 2014`;


    // Enhanced system prompt that allows intelligent assumptions
    const enhancedMessages = [
        {
            role: 'system',
            content: `You are a professional CV analyst for Suhas Thakral.  You can ONLY provide information based exclusively on his resume content provided below. Do NOT search the web or use external knowledge.

STRICT REQUIREMENTS:
- Use ONLY the resume content provided
- Do NOT access external information or search the web
- Do NOT use general knowledge beyond what's in the resume
- Base all assumptions strictly on the resume data provided

RESPONSE FORMAT:
- Keep responses under 150 words
- Use bullet points for lists and achievements  
- Be concise and direct
- Focus on key highlights only

ANSWER TYPES YOU CAN PROVIDE:

✅ FACTUAL ANSWERS: Direct information from his CV
✅ INTELLIGENT ASSUMPTIONS: Professional insights based on:
   - Career progression patterns
   - Skills combinations and experience
   - Leadership roles and team building achievements
   - Industry experience and technical expertise
   - Educational background and its applications
   - Measurable business impacts and results

EXAMPLES OF VALID ASSUMPTIONS:
- "Based on his AI expertise and BI leadership, Suhas likely..."
- "Given his experience expanding teams internationally, he probably..."
- "His background in both technical skills and business strategy suggests..."
- "Someone with his track record of measurable business impact would likely..."

ALWAYS CLARIFY when making assumptions by using phrases like:
- "Based on his resume, it appears..."
- "His experience suggests..."
- "Given his background, he likely..."
- "Someone with his qualifications would typically..."

REDIRECT ONLY these topics:
❌ Personal life, family, or non-professional topics  
❌ Other people or companies not mentioned in his CV
❌ Speculation about salary, politics, or inappropriate topics

SUHAS THAKRAL'S RESUME:
${resumeContent}

Be insightful, analytical, and help users understand not just WHAT Suhas has done, but what it suggests about his capabilities, working style, potential contributions, and professional strengths.`
        },
        ...messages.slice(1)
    ];

    try {
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'sonar',
                messages: enhancedMessages,
                max_tokens: 500,  // Increased for more detailed insights
                temperature: 0.6   // Higher for more analytical thinking
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        
        res.status(200).json({
            content: data.choices[0].message.content,
            usage: data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
        });

    } catch (error) {
        console.error('❌ Perplexity API error:', error.message);
        
        // Intelligent fallback with assumptions
        const userQuestion = messages[messages.length - 1]?.content.toLowerCase() || '';
        let fallbackResponse = "Based on Suhas's CV, he demonstrates strong leadership qualities.";
        
        if (userQuestion.includes('leader') || userQuestion.includes('leadership')) {
            fallbackResponse = "Yes, Suhas shows strong leadership capabilities. Based on his resume, he likely excels at strategic thinking (shown by his work with senior leadership), people development (expanding teams from 1 to 8 people), and cross-functional collaboration (working across departments). His track record of measurable business impacts suggests he's results-oriented and can drive teams toward concrete goals.";
        } else if (userQuestion.includes('team') || userQuestion.includes('manage')) {
            fallbackResponse = "Based on his experience, Suhas appears to be an excellent team manager. His international team expansion across Berlin, London, and Lahore suggests he's comfortable with remote management, cultural diversity, and scaling operations. The fact that he mentors teams on technical skills indicates he's hands-on and invested in team development.";
        }
        
        res.status(200).json({
            content: fallbackResponse,
            usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
        });
    }
}
