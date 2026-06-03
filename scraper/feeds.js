// All RSS / Reddit feeds organized by category. Each: { name, url, category }
const FEEDS = [
  // ── Business & Entrepreneurship ──
  { name: 'Harvard Business Review', url: 'https://hbr.org/feed', category: 'Business' },
  { name: 'Inc Magazine', url: 'https://www.inc.com/rss', category: 'Business' },
  { name: 'Fast Company', url: 'https://www.fastcompany.com/feed', category: 'Business' },
  { name: 'Fortune', url: 'https://fortune.com/feed', category: 'Business' },
  { name: 'Forbes Entrepreneurs', url: 'https://www.forbes.com/entrepreneurs/feed/', category: 'Business' },
  { name: 'Entrepreneur Magazine', url: 'https://www.entrepreneur.com/latest.rss', category: 'Business' },
  { name: 'Business Insider', url: 'https://feeds.businessinsider.com/custom/all', category: 'Business' },
  { name: 'The Hustle', url: 'https://thehustle.co/feed/', category: 'Business' },
  { name: 'Morning Brew', url: 'https://feeds.feedburner.com/morning-brew-daily-brief', category: 'Business' },
  { name: 'r/Entrepreneur', url: 'https://www.reddit.com/r/Entrepreneur/.rss', category: 'Business' },
  { name: 'r/smallbusiness', url: 'https://www.reddit.com/r/smallbusiness/.rss', category: 'Business' },
  { name: 'r/freelance', url: 'https://www.reddit.com/r/freelance/.rss', category: 'Business' },

  // ── Marketing & Growth ──
  { name: 'Marketing Week', url: 'https://www.marketingweek.com/feed/', category: 'Marketing' },
  { name: 'Adweek', url: 'https://www.adweek.com/feed/', category: 'Marketing' },
  { name: 'Social Media Examiner', url: 'https://www.socialmediaexaminer.com/feed/', category: 'Marketing' },
  { name: 'Content Marketing Institute', url: 'https://contentmarketinginstitute.com/feed/', category: 'Marketing' },
  { name: 'Neil Patel Blog', url: 'https://neilpatel.com/blog/feed/', category: 'Marketing' },
  { name: 'Copyblogger', url: 'https://copyblogger.com/feed/', category: 'Marketing' },
  { name: 'Search Engine Journal', url: 'https://www.searchenginejournal.com/feed/', category: 'Marketing' },
  { name: 'HubSpot Marketing', url: 'https://blog.hubspot.com/marketing/rss.xml', category: 'Marketing' },
  { name: 'r/marketing', url: 'https://www.reddit.com/r/marketing/.rss', category: 'Marketing' },
  { name: 'r/SEO', url: 'https://www.reddit.com/r/SEO/.rss', category: 'Marketing' },
  { name: 'r/copywriting', url: 'https://www.reddit.com/r/copywriting/.rss', category: 'Marketing' },

  // ── Tech & AI ──
  { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', category: 'Tech' },
  { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', category: 'Tech' },
  { name: 'Wired', url: 'https://www.wired.com/feed/rss', category: 'Tech' },
  { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', category: 'Tech' },
  { name: 'MIT Technology Review', url: 'https://www.technologyreview.com/feed/', category: 'Tech' },
  { name: 'Hacker News RSS', url: 'https://hnrss.org/frontpage', category: 'Tech' },
  { name: 'Product Hunt', url: 'https://www.producthunt.com/feed', category: 'Tech' },
  { name: 'r/technology', url: 'https://www.reddit.com/r/technology/.rss', category: 'Tech' },
  { name: 'r/artificial', url: 'https://www.reddit.com/r/artificial/.rss', category: 'AI' },
  { name: 'r/MachineLearning', url: 'https://www.reddit.com/r/MachineLearning/.rss', category: 'AI' },
  { name: 'r/OpenAI', url: 'https://www.reddit.com/r/OpenAI/.rss', category: 'AI' },
  { name: 'VentureBeat AI', url: 'https://venturebeat.com/category/ai/feed/', category: 'AI' },

  // ── Finance & Investing ──
  { name: 'Reuters Business', url: 'https://feeds.reuters.com/reuters/businessNews', category: 'Finance' },
  { name: 'Bloomberg Markets', url: 'https://feeds.bloomberg.com/markets/news.rss', category: 'Finance' },
  { name: 'MarketWatch', url: 'https://feeds.marketwatch.com/marketwatch/topstories/', category: 'Finance' },
  { name: 'Seeking Alpha', url: 'https://seekingalpha.com/feed.xml', category: 'Finance' },
  { name: 'r/investing', url: 'https://www.reddit.com/r/investing/.rss', category: 'Finance' },
  { name: 'r/personalfinance', url: 'https://www.reddit.com/r/personalfinance/.rss', category: 'Finance' },
  { name: 'r/financialindependence', url: 'https://www.reddit.com/r/financialindependence/.rss', category: 'Finance' },

  // ── Creator Economy & LinkedIn ──
  { name: 'Creator Economy Newsletter', url: 'https://creatoreconomy.so/feed', category: 'Creator Economy' },
  { name: 'r/youtubers', url: 'https://www.reddit.com/r/youtubers/.rss', category: 'Creator Economy' },
  { name: 'r/podcasting', url: 'https://www.reddit.com/r/podcasting/.rss', category: 'Creator Economy' },
  { name: 'r/newsletters', url: 'https://www.reddit.com/r/newsletters/.rss', category: 'Creator Economy' },
  { name: 'Substack Reads', url: 'https://substack.com/feed', category: 'Creator Economy' },

  // ── SaaS & Startups ──
  { name: 'SaaStr', url: 'https://www.saastr.com/feed/', category: 'SaaS' },
  { name: 'First Round Review', url: 'https://review.firstround.com/feed.xml', category: 'SaaS' },
  { name: 'a16z Blog', url: 'https://a16z.com/feed/', category: 'SaaS' },
  { name: 'Y Combinator Blog', url: 'https://www.ycombinator.com/blog/rss', category: 'SaaS' },
  { name: 'r/SaaS', url: 'https://www.reddit.com/r/SaaS/.rss', category: 'SaaS' },
  { name: 'r/startups', url: 'https://www.reddit.com/r/startups/.rss', category: 'SaaS' },
  { name: 'Indie Hackers', url: 'https://www.indiehackers.com/feed.xml', category: 'SaaS' },

  // ── Productivity & Mindset ──
  { name: 'James Clear', url: 'https://jamesclear.com/feed', category: 'Mindset' },
  { name: 'Paul Graham Essays', url: 'http://www.paulgraham.com/rss.html', category: 'Mindset' },
  { name: 'r/productivity', url: 'https://www.reddit.com/r/productivity/.rss', category: 'Productivity' },
  { name: 'r/selfimprovement', url: 'https://www.reddit.com/r/selfimprovement/.rss', category: 'Mindset' },
  { name: 'r/getdisciplined', url: 'https://www.reddit.com/r/getdisciplined/.rss', category: 'Mindset' },

  // ── Ecommerce ──
  { name: 'Shopify Blog', url: 'https://www.shopify.com/blog.atom', category: 'Ecommerce' },
  { name: 'Practical Ecommerce', url: 'https://www.practicalecommerce.com/feed', category: 'Ecommerce' },
  { name: 'r/ecommerce', url: 'https://www.reddit.com/r/ecommerce/.rss', category: 'Ecommerce' },
  { name: 'r/dropship', url: 'https://www.reddit.com/r/dropship/.rss', category: 'Ecommerce' },
  { name: 'r/FulfillmentByAmazon', url: 'https://www.reddit.com/r/FulfillmentByAmazon/.rss', category: 'Ecommerce' },

  // ── Leadership & Career ──
  { name: 'LinkedIn Official Blog', url: 'https://blog.linkedin.com/feed', category: 'Leadership' },
  { name: 'r/careerguidance', url: 'https://www.reddit.com/r/careerguidance/.rss', category: 'Leadership' },
  { name: 'r/leadership', url: 'https://www.reddit.com/r/leadership/.rss', category: 'Leadership' },
  { name: 'r/remotework', url: 'https://www.reddit.com/r/remotework/.rss', category: 'Leadership' },
]

const CATEGORIES = ['Business', 'Marketing', 'Tech', 'AI', 'Finance', 'Creator Economy', 'SaaS', 'Mindset', 'Productivity', 'Ecommerce', 'Leadership']

module.exports = { FEEDS, CATEGORIES }
