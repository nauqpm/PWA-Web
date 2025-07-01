const mongoose = require('mongoose');
const News = require('./models/News');
require('dotenv').config();

const sampleNews = [
  {
    title: "The Future of AI: What's Next in 2024",
    excerpt: "Exploring the latest developments in artificial intelligence and their impact on various industries.",
    content: "Artificial Intelligence continues to evolve at a rapid pace, with new breakthroughs being announced almost daily. From advanced language models to computer vision systems, AI is transforming how we live and work. In 2024, we're seeing a shift towards more practical applications of AI in healthcare, finance, and manufacturing. Companies are increasingly focusing on responsible AI development and addressing ethical concerns...",
    category: "technology",
    author: "Dr. Sarah Chen",
    publishTime: "2024-03-15T10:30:00Z",
    readTime: "5 min read",
    views: 1250,
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995",
    featured: true
  },
  {
    title: "Global Markets React to New Economic Policies",
    excerpt: "Major stock markets show mixed reactions to recent economic policy changes worldwide.",
    content: "Global financial markets experienced significant volatility this week as investors reacted to new economic policies announced by major central banks. The Federal Reserve's decision to maintain current interest rates has been met with cautious optimism, while European markets showed signs of concern over inflation data...",
    category: "business",
    author: "Michael Thompson",
    publishTime: "2024-03-14T15:45:00Z",
    readTime: "4 min read",
    views: 980,
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3",
    featured: false
  },
  {
    title: "Olympic Games 2024: Preparations in Full Swing",
    excerpt: "Paris gears up for the 2024 Olympic Games with innovative infrastructure projects.",
    content: "With just months to go before the opening ceremony, Paris is transforming into a world-class sporting venue. The city's ambitious infrastructure projects are nearing completion, including the new Olympic Village and state-of-the-art sports facilities. Organizers are implementing sustainable practices throughout the event...",
    category: "sports",
    author: "Emma Rodriguez",
    publishTime: "2024-03-13T09:15:00Z",
    readTime: "6 min read",
    views: 2100,
    image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da",
    featured: true
  },
  {
    title: "Breakthrough in Cancer Research",
    excerpt: "Scientists discover promising new approach to cancer treatment.",
    content: "A team of researchers has made a significant breakthrough in cancer treatment, developing a new method that targets cancer cells more effectively while reducing side effects. The study, published in a leading medical journal, shows promising results in early clinical trials...",
    category: "health",
    author: "Dr. James Wilson",
    publishTime: "2024-03-12T14:20:00Z",
    readTime: "7 min read",
    views: 3500,
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef",
    featured: true
  },
  {
    title: "New Streaming Platform Shakes Up Entertainment Industry",
    excerpt: "Tech giant launches revolutionary streaming service with unique features.",
    content: "A major technology company has entered the streaming wars with an innovative platform that promises to change how we consume entertainment. The new service combines traditional streaming with interactive features and social elements, creating a more engaging viewing experience...",
    category: "entertainment",
    author: "Lisa Chen",
    publishTime: "2024-03-11T11:00:00Z",
    readTime: "4 min read",
    views: 1800,
    image: "https://images.unsplash.com/photo-1593784991095-a205069470b6",
    featured: false
  },
  {
    title: "Quantum Computing Milestone Achieved",
    excerpt: "Researchers achieve quantum supremacy in solving complex problems.",
    content: "Scientists have reached a significant milestone in quantum computing, demonstrating the ability to solve problems that would take classical computers thousands of years to complete. This breakthrough opens new possibilities for cryptography, drug discovery, and climate modeling...",
    category: "technology",
    author: "Dr. Robert Kim",
    publishTime: "2024-03-10T16:30:00Z",
    readTime: "8 min read",
    views: 4200,
    image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb",
    featured: true
  },
  {
    title: "Sustainable Business Practices Gain Momentum",
    excerpt: "Companies worldwide adopt eco-friendly initiatives.",
    content: "A growing number of businesses are implementing sustainable practices as consumer demand for environmentally responsible products increases. From reducing carbon footprints to implementing circular economy principles, companies are finding innovative ways to operate sustainably...",
    category: "business",
    author: "David Martinez",
    publishTime: "2024-03-09T13:45:00Z",
    readTime: "5 min read",
    views: 1600,
    image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09",
    featured: false
  },
  {
    title: "World Cup Qualifiers: Surprise Results",
    excerpt: "Underdog teams make unexpected advances in World Cup qualifiers.",
    content: "The World Cup qualifiers have produced several surprising results, with traditionally lower-ranked teams showing remarkable improvement. These unexpected outcomes are reshaping the landscape of international football and creating new rivalries...",
    category: "sports",
    author: "Carlos Mendez",
    publishTime: "2024-03-08T10:15:00Z",
    readTime: "4 min read",
    views: 2800,
    image: "https://images.unsplash.com/photo-1637203727770-3fff478fb1ef?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fFdvcmxkJTIwQ3VwJTIwUXVhbGlmaWVyc3xlbnwwfHwwfHx8MA%3D%3D",
    featured: false
  },
  {
    title: "AI-Powered Tools Revolutionize Software Development",
    excerpt: "Developers embrace AI assistants to boost productivity and reduce bugs.",
    content: "With AI-powered coding assistants like GitHub Copilot and Tabnine gaining popularity, developers are experiencing faster workflows, fewer errors, and better code suggestions. These tools are transforming the way software is written in both startups and large enterprises...",
    category: "technology",
    author: "Liam Walker",
    publishTime: "2024-03-06T09:00:00Z",
    readTime: "5 min read",
    views: 2700,
    image: "https://images.unsplash.com/photo-1631624215749-b10b3dd7bca7?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8U29mdHdhcmUlMjBEZXZlbG9wbWVudHxlbnwwfHwwfHx8MA%3D%3D",
    featured: true
  },
  {
    title: "Startups Face Funding Slowdown in 2024",
    excerpt: "Global economic conditions impact venture capital investments.",
    content: "Venture capital funding for startups has dipped significantly in early 2024 due to market uncertainties. Investors are now focusing on profitability and sustainable growth over aggressive expansion...",
    category: "business",
    author: "Samantha Green",
    publishTime: "2024-03-05T13:15:00Z",
    readTime: "4 min read",
    views: 1900,
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8U3RhcnR1cHN8ZW58MHx8MHx8fDA%3D",
    featured: false
  },
  {
    title: "Championship Finals Deliver Stunning Upsets",
    excerpt: "Unexpected results redefine team rankings in global tournaments.",
    content: "Fans were treated to jaw-dropping moments during the finals, where underdog teams outperformed seasoned champions. Analysts believe this shift signals a new era in competitive sports...",
    category: "sports",
    author: "Carlos Rivera",
    publishTime: "2024-03-04T17:45:00Z",
    readTime: "6 min read",
    views: 3600,
    image: "https://images.unsplash.com/photo-1521412644187-c49fa049e84d",
    featured: true
  },
  {
    title: "Wearable Devices Detect Early Signs of Illness",
    excerpt: "Smartwatches now track more than just steps — they may save lives.",
    content: "With advanced biometric sensors, modern wearables can now detect irregular heart rhythms, oxygen saturation, and even stress levels. Researchers say these tools are aiding early diagnosis of serious conditions...",
    category: "health",
    author: "Dr. Fiona Le",
    publishTime: "2024-03-03T08:30:00Z",
    readTime: "5 min read",
    views: 2400,
    image: "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8V2VhcmFibGUlMjBEZXZpY2VzfGVufDB8fDB8fHww",
    featured: false
  },
  {
    title: "Streaming Services Compete with Interactive Content",
    excerpt: "Platforms race to offer viewer-driven stories and gameplay.",
    content: "Netflix and other major streaming platforms are investing in interactive movies and game-based storytelling. This strategy aims to retain younger audiences and increase screen time engagement...",
    category: "entertainment",
    author: "Jenna Lee",
    publishTime: "2024-03-02T12:20:00Z",
    readTime: "4 min read",
    views: 2100,
    image: "https://images.unsplash.com/photo-1717295248358-4b8f2c8989d6?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8U3RyZWFtaW5nJTIwU2VydmljZXN8ZW58MHx8MHx8fDA%3D",
    featured: false
  },
  {
    title: "5G-Enabled Drones Improve Logistics Efficiency",
    excerpt: "Businesses adopt 5G-connected drones for real-time delivery tracking.",
    content: "The combination of 5G and autonomous drones is streamlining logistics in urban areas. Companies are piloting contactless delivery systems with high-speed connectivity and precision tracking...",
    category: "technology",
    author: "Nathan Brooks",
    publishTime: "2024-03-01T15:00:00Z",
    readTime: "6 min read",
    views: 3200,
    image: "https://images.unsplash.com/photo-1690219773393-85456d9e4c77?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fDVHJTIwRW5hYmxlZCUyMERyb25lc3xlbnwwfHwwfHx8MA%3D%3D",
    featured: true
  },
  {
    title: "Small Businesses Go Digital to Survive",
    excerpt: "Local entrepreneurs embrace e-commerce and remote tools.",
    content: "From online shops to remote service offerings, small businesses are transforming digitally to stay competitive. Government support and easy-to-use platforms are enabling the shift...",
    category: "business",
    author: "Michelle Tan",
    publishTime: "2024-02-29T09:50:00Z",
    readTime: "5 min read",
    views: 2000,
    image: "https://images.unsplash.com/photo-1488229297570-58520851e868?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fERpZ2l0YWx8ZW58MHx8MHx8fDA%3D",
    featured: false
  },
  {
    title: "Rising Stars Shine in National Basketball League",
    excerpt: "Young athletes impress with record-breaking performances.",
    content: "This season has seen several young talents dominating the court and breaking previous scoring records. Scouts and fans are already predicting international careers for these new stars...",
    category: "sports",
    author: "Emily Watson",
    publishTime: "2024-02-28T18:00:00Z",
    readTime: "4 min read",
    views: 2800,
    image: "https://images.unsplash.com/photo-1694437590805-cf944ceb41c4?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8TmF0aW9uYWwlMjBCYXNrZXRiYWxsJTIwTGVhZ3VlfGVufDB8fDB8fHww",
    featured: false
  },
  {
    title: "Nutrition Trends Shift Toward Plant-Based Diets",
    excerpt: "More people choose sustainable eating habits.",
    content: "Health experts are seeing a steady rise in plant-based food consumption. With environmental concerns and health awareness, consumers are shifting toward vegan and flexitarian diets...",
    category: "health",
    author: "Dr. Laura Kim",
    publishTime: "2024-02-27T14:10:00Z",
    readTime: "5 min read",
    views: 2300,
    image: "https://images.unsplash.com/photo-1684160244466-b89ef03b7638?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8TnV0cml0aW9uJTIwVHJlbmRzfGVufDB8fDB8fHww",
    featured: false
  },
  {
    title: "Award Season Kicks Off with Surprise Nominations",
    excerpt: "Unexpected films and actors headline this year’s award buzz.",
    content: "The entertainment world is abuzz as the award season begins. This year's nominations include a diverse mix of indie films and breakout performances, signaling a refreshing shift in the industry...",
    category: "entertainment",
    author: "Olivia Nguyen",
    publishTime: "2024-02-26T11:30:00Z",
    readTime: "4 min read",
    views: 2500,
    image: "https://images.unsplash.com/photo-1706193589333-da530df63ecf?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8QXdhcmQlMjBTZWFzb24lMjBLaWNrcyUyME9mZnxlbnwwfHwwfHx8MA%3D%3D",
    featured: true
  },
  {
    title: "AI Revolutionizes Software Development in 2024",
    excerpt: "Artificial Intelligence is accelerating the way developers write and maintain code.",
    content: "In 2024, AI-powered tools like code assistants and automated testing platforms are transforming how software is built. Developers now rely on machine learning models to detect bugs, generate documentation, and even refactor legacy code with higher speed and accuracy...",
    category: "technology",
    author: "David Nguyen",
    publishTime: "2024-04-10T10:30:00Z",
    readTime: "5 min read",
    views: 2400,
    image: "https://images.unsplash.com/photo-1631624215749-b10b3dd7bca7?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8U29mdHdhcmUlMjBEZXZlbG9wbWVudHxlbnwwfHwwfHx8MA%3D%3D",
    featured: false
  },
  {
    title: "5G Expansion Boosts IoT Innovations",
    excerpt: "Faster connectivity opens doors to smarter cities and industrial automation.",
    content: "The rapid expansion of 5G networks in 2024 is enabling new innovations in the Internet of Things (IoT). From smart home devices to real-time data collection in manufacturing, low latency and high bandwidth are key enablers for seamless automation and control...",
    category: "technology",
    author: "Linda Chen",
    publishTime: "2024-04-18T09:00:00Z",
    readTime: "6 min read",
    views: 1750,
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475",
    featured: false
  }
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Clear existing data
    await News.deleteMany({});
    console.log('Cleared existing news data');

    // Insert sample data
    await News.insertMany(sampleNews);
    console.log('Successfully seeded database with sample news');

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seed function
seedDatabase(); 