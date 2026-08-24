# Bot Management

Bots generate nearly half of all internet traffic. While many bots serve legitimate purposes like search engine crawling and content aggregation, others originate from malicious sources. Bot management encompasses both observing and controlling all bot traffic. A key component of this is bot protection, which focuses specifically on mitigating risks from automated threats that scrape content, attempt unauthorized logins, or overload servers.

## On this page

- [How bot management works](#how-bot-management-works)
  - [Methods of bot management and protection](#methods-of-bot-management-and-protection)
- [Bot protection managed ruleset](#bot-protection-managed-ruleset)
  - [Enable the ruleset](#enable-the-ruleset)
  - [Bot protection ruleset with reverse proxies](#bot-protection-ruleset-with-reverse-proxies)
- [AI bots managed ruleset](#ai-bots-managed-ruleset)
  - [Enable the ruleset](#enable-the-ruleset-1)
- [Verified bots](#verified-bots)
  - [Bot verification methods](#bot-verification-methods)
  - [Verified bots directory](#verified-bots-directory)
- [Related Vercel documentation](#related-vercel-documentation)

## How bot management works

Bot management systems analyze incoming traffic to identify and classify requests based on their source and intent. This includes:

- Verifying and allowing legitimate bots that correctly identify themselves
- Monitoring bot traffic patterns and resource consumption
- Detecting and challenging suspicious traffic that behaves abnormally
- Enforcing browser-like behavior by verifying navigation patterns and cache usage

### Methods of bot management and protection

To effectively manage bot traffic and protect against harmful bots, you can use various techniques, including:

- Signature-based detection: Inspecting HTTP requests for known bot signatures
- Rate limiting: Restricting how often certain actions can be performed to prevent abuse
- Challenges: [Using JavaScript checks to verify human presence](/docs/vercel-firewall/firewall-concepts#challenge)
- Behavioral analysis: Detecting unusual patterns in user activity that suggest automation

With Vercel, you can use:

- [Managed rulesets](/docs/vercel-firewall/vercel-waf/managed-rulesets#configure-bot-protection-managed-ruleset) to challenge specific bot traffic
- Rate limiting and challenge actions with [WAF custom rules](/docs/vercel-firewall/vercel-waf/custom-rules) to prevent bot activity from reaching your application
- [DDoS protection](/docs/vercel-firewall/ddos-mitigation) to defend your application against bot driven attacks
- [Observability](/docs/observability) and [Firewall](/docs/vercel-firewall/firewall-observability) to monitor bot patterns, traffic sources, and the effectiveness of your bot management strategies

## Bot protection managed ruleset

Bot protection managed ruleset is available on [all plans](/docs/plans)

With Vercel, you can use the bot protection managed ruleset to [challenge](/docs/vercel-firewall/firewall-concepts#challenge) non-browser traffic from accessing your applications. It filters out automated threats while allowing legitimate traffic.

- It identifies clients that violate browser-like behavior and serves a javascript challenge to them.
- It prevents requests that falsely claim to be from a browser such as a `curl` request identifying as Chrome.
- It automatically excludes [verified bots](#verified-bots), such as Google's crawler, from evaluation.

To learn more about how the ruleset works, review the [Challenge](/docs/vercel-firewall/firewall-concepts#challenge) section of [Firewall actions](/docs/vercel-firewall/firewall-concepts#firewall-actions). To understand the details of what get logged and how to monitor your traffic, review [Firewall Observability](/docs/vercel-firewall/firewall-observability).

For trusted automated traffic, you can create [custom WAF rules](/docs/vercel-firewall/vercel-waf/custom-rules) with [bypass actions](/docs/vercel-firewall/firewall-concepts#bypass) that will allow this traffic to skip the bot protection ruleset.

### Enable the ruleset

The ruleset is inactive by default. In the dashboard this is labeled Off. Matching traffic is not evaluated and reaches your application.

You can apply the ruleset to your project in [log](/docs/vercel-firewall/firewall-concepts#log) or [challenge](/docs/vercel-firewall/firewall-concepts#challenge) mode. Learn how to [configure the bot protection managed ruleset](/docs/vercel-firewall/vercel-waf/managed-rulesets#configure-bot-protection-managed-ruleset).

### Bot protection ruleset with reverse proxies

Bot Protection doesn't work when a reverse proxy (e.g. Cloudflare, Azure, or other CDNs) is placed in front of your Vercel deployment. This setup significantly degrades detection accuracy and performance, leading to a suboptimal end-user experience.

[Reverse proxies](/docs/security/reverse-proxy) interfere with Vercel's ability to reliably identify bots:

- Obscured detection signals: Legitimate users may be incorrectly challenged because the proxy masks signals that Bot Protection relies on.
- Frequent re-challenges: Some proxies rotate their exit node IPs frequently, forcing Vercel to re-initiate the challenge on every IP change.

## AI bots managed ruleset

AI bots managed ruleset is available on [all plans](/docs/plans)

Vercel's AI bots managed ruleset allows you to control traffic from AI bots that crawl your site for training data, search purposes, or user-generated fetches.

- It identifies and filters requests from known AI crawlers and bots.
- It provides options to log or deny these requests based on your preferences.
- The list of known AI bots is automatically maintained and updated by Vercel.

When new AI bots emerge, Vercel automatically adds them to its managed list and handles them according to your existing configured action without requiring any changes on your part.

### Enable the ruleset

The ruleset is inactive by default. In the dashboard this is labeled Allow. Matching traffic is not evaluated and reaches your application.

You can apply the ruleset to your project in [log](/docs/vercel-firewall/firewall-concepts#log) or [deny](/docs/vercel-firewall/firewall-concepts#deny) mode. Learn how to [configure the AI bots managed ruleset](/docs/vercel-firewall/vercel-waf/managed-rulesets#configure-ai-bots-managed-ruleset).

## Verified bots

Vercel maintains and continuously updates a comprehensive directory of known legitimate bots from across the internet. This directory is regularly updated to include new legitimate services as they emerge. [Attack Mode](/docs/vercel-firewall/attack-mode#known-bots-support) and bot protection automatically recognize and allow these bots to pass through without being challenged. You can block access to some or all of these bots by writing [WAF custom rules](/docs/vercel-firewall/vercel-waf/custom-rules) with the User Agent match condition or Signature-Agent header. To learn how to do this, review [WAF Examples](/docs/vercel-firewall/vercel-waf/examples).

### Bot verification methods

To prove that bots are legitimate and verify their claimed identity, several methods are used:

- IP Address Verification: Checking if requests originate from known IP ranges owned by legitimate bot operators (e.g., Google's Googlebot, Bing's crawler).
- Reverse DNS Lookup: Performing reverse DNS queries to verify that an IP address resolves back to the expected domain (e.g., an IP claiming to be Googlebot should resolve to `*.googlebot.com` or `*.google.com`).
- Cryptographic Verification: Using digital signatures to authenticate bot requests through protocols like [Web Bot Authentication](https://datatracker.ietf.org/doc/html/draft-meunier-web-bot-auth-architecture), which employs HTTP Message Signatures (RFC 9421) to cryptographically verify automated requests.

### Verified bots directory

[Submit a bot request](https://bots.fyi/new-bot) if you are a SaaS provider and would like to be added to this list.

| Bot name | Category | Description | Documentation |
| --- | --- | --- | --- |
| adagiobot | advertising | Adagiobot is a web crawler that analyzes websites for advertising demand optimization, helping publishers maximize revenue through real-time bidding analysis and performance insights. AdagioBot fetches /ads.txt, /app-ads.txt and /sellers.json files to comply with IAB Supply Chain Validation. | [View](https://adagio-io.gitbook.io/adagio-documentation/general-configuration/update-your-app-ads.txt-file) |
| adidxbot | advertising | AdIdxBot is the crawler used by Bing Ads for quality control of ads and their destination websites. It has multiple user agent variants including desktop, iPhone, and Windows Phone versions. | [View](https://www.bing.com/webmasters/help/which-crawlers-does-bing-use-8c184ec0) |
| adsense | advertising | The AdSense crawler visits participating sites in order to provide them with relevant ads. | [View](https://developers.google.com/search/docs/crawling-indexing/overview-google-crawlers) |
| adyen-webhook | webhook | Adyen's webhooks (Notification API) send encrypted, real-time HTTP callbacks for key payment and account events—automating order fulfillment, settlement reconciliation, and risk-management workflows. | [View](https://docs.adyen.com/development-resources/webhooks/secure-webhooks#domain-and-ip-addresses) |
| ahrefsbot | search\_engine\_optimization | Powers the database for both Ahrefs, a marketing intelligence platform, and Yep, an independent, privacy-focused search engine. | [View](https://help.ahrefs.com/en/articles/78658-what-is-the-list-of-your-ip-ranges) |
| ahrefssiteaudit | search\_engine\_optimization | Powers Ahrefs' Site Audit tool. Ahrefs users can use Site Audit to analyze websites and find both technical SEO and on-page SEO issues. | [View](https://help.ahrefs.com/en/articles/78658-what-is-the-list-of-your-ip-ranges) |
| algolia | search\_engine\_crawler | The Algolia Crawler extracts content from your site and makes it searchable. | [View](https://www.algolia.com/doc/tools/crawler/getting-started/overview/) |
| amazon-adbot | advertising | Amazon AdBot is a crawler used by different advertising services at Amazon to determine a website's content in order to provide relevant and appropriate advertising. Amazon AdBot only crawls websites for which Amazon or an advertiser partner may serve an ad. | [View](https://adbot.amazon.com/) |
| amazon-kendra | ai\_assistant | Amazon Kendra is a managed information retrieval and intelligent search service that uses natural language processing and advanced deep learning model. | [View](https://docs.aws.amazon.com/kendra/latest/dg/data-source-web-crawler.html) |
| amazon-q | ai\_assistant | Amazon Q Business is a generative artificial intelligence (generative AI)-powered assistant that you can tailor to your business needs. | [View](https://docs.aws.amazon.com/amazonq/latest/qbusiness-ug/webcrawler-overview.html) |
| amazonbot | ai\_crawler | Amazonbot is Amazon's web crawler used to improve our services, such as enabling Alexa to more accurately answer questions for customers. | [View](https://developer.amazon.com/amazonbot) |
| apis-google | search\_engine\_crawler | Crawling preferences addressed to the APIs-Google user agent affect the delivery of push notification messages by Google APIs. | [View](https://developers.google.com/search/docs/crawling-indexing/overview-google-crawlers) |
| apple-podcasts | feed\_fetcher | Apple Podcasts crawler that only accesses URLs associated with registered content on Apple Podcasts. Does not follow robots.txt. | [View](https://support.apple.com/en-us/119829) |
| applebot | ai\_crawler | Applebot powers search features in Apple's ecosystem (Spotlight, Siri, Safari) and may be used to train Apple's foundation models for generative AI features. | [View](https://support.apple.com/en-us/119829) |
| artemis-web-crawler | feed\_fetcher | Artemis is a calm web reader with which you can follow websites and blogs. | [View](https://artemis.jamesg.blog/bot) |
| atlassian-jira-webhooks | webhook | Delivers webhook notifications from Jira Cloud when issues, projects, or other resources change. | [View](https://developer.atlassian.com/cloud/jira/platform/webhooks/) |
| rovo | ai\_crawler | Crawls and indexes web content for Atlassian Rovo's AI-powered search, chat, and agents. | [View](https://support.atlassian.com/organization-administration/docs/connect-custom-website-to-rovo/) |
| baiduspider | search\_engine\_crawler | Baiduspider is Baidu's web crawler that indexes websites for inclusion in its Chinese-market search results. | [View](https://www.baidu.jp/) |
| barkrowler | search\_engine\_optimization | Barkrowler is Babbar's web crawler that fuels and updates their graph representation of the web, providing SEO tools for the marketing community. | [View](https://www.babbar.tech/crawler) |
| better-stack | monitor | Better Stack is a platform for monitoring and alerting on your applications. | [View](https://betterstack.com/docs/uptime/frequently-asked-questions/) |
| bingbot | search\_engine\_crawler | Bingbot is Microsoft's web crawler used for indexing websites for Bing Search. | [View](https://www.bing.com/webmasters/help/how-to-verify-bingbot-3905dc26) |
| brightbot | monitor | Brightbot is Bright Data's crawler layer that monitors the health of websites and enforces ethical web data collection. It prevents access to non-public information and blocks interactive endpoints that could be abused, acting as a guardian for ethical data collection. | [View](https://brightdata.com/trustcenter/brightbot-ethical-web-data-guardian) |
| browserbase | ai\_crawler | Runs headless browser automation on behalf of Browserbase customers for web scraping, form submission, and testing. | [View](https://docs.browserbase.com/introduction) |
| buffer-link-preview-bot | preview | Helps Buffer users create better social media posts by generating rich previews when they share links | [View](https://scraper.buffer.com/about/bots/link-preview-bot) |
| ccbot | ai\_crawler | CCBot is operated by the Common Crawl Foundation to crawl web content for AI training and research. Common Crawl is a non-profit organization that maintains an open repository of web crawl data that is universally accessible for research and analysis. | [View](https://commoncrawl.org/faq/) |
| channel3bot | ecommerce | Crawls product detail pages to index content for AI-powered product discovery, routing shoppers to original websites. | [View](https://trychannel3.com/channel3bot) |
| chatgpt-operator | ai\_assistant | Handles user-initiated requests from ChatGPT operator accessing external content; not used for automated crawling or AI training. | [View](https://help.openai.com/en/articles/11845367-chatgpt-agent-allowlisting) |
| chatgpt-user | ai\_assistant | Handles user-initiated requests in ChatGPT, accessing external content to provide real-time information; not used for automated crawling or AI training. | [View](https://platform.openai.com/docs/bots) |
| checkly | monitor | Checkly is a platform for monitoring and alerting on your applications. | [View](https://www.checklyhq.com/docs/monitoring/allowlisting/) |
| chrome-lighthouse | analytics | PageSpeed Insights (PSI) reports on the user experience of a page on both mobile and desktop devices, and provides suggestions on how that page may be improved. | [View](https://developers.google.com/search/docs/crawling-indexing/google-user-triggered-fetchers) |
| chrome-privacy-preserving-prefetch-proxy | preview | Chrome's Privacy Preserving Prefetch Proxy service that fetches /.well-known/traffic-advice to enable privacy-preserving prefetch hints. | [View](https://developer.chrome.com/blog/private-prefetch-proxy) |
| claude-searchbot | ai\_assistant | Claude-SearchBot navigates the web to improve search result quality for users. It analyzes online content specifically to enhance the relevance and accuracy of search responses. | [View](https://support.anthropic.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler) |
| claude-user | ai\_assistant | Claude-User supports Claude AI users. When individuals ask questions to Claude, it may access websites using a Claude-User agent. | [View](https://docs.anthropic.com/en/api/ip-addresses) |
| claudebot | ai\_crawler | ClaudeBot helps enhance the utility and safety of our generative AI models by collecting web content that could potentially contribute to their training. | [View](https://support.anthropic.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler) |
| cloudflare-customer-slo-prober | monitor | Automated probes that monitor the availability and latency of enrolled customer endpoints. | [View](https://bot-auth-worker.product-sre.workers.dev/about) |
| cookiebot | monitor | Cookiebot automates compliance with cookie laws and helps you manage your cookie consent preferences. | [View](https://support.cookiebot.com/hc/en-us/articles/360003824153-Whitelisting-the-Cookiebot-scanner) |
| criteobot | advertising | CriteoBot is a crawler operated by Criteo that analyzes web content to serve relevant contextual ads. The bot respects robots.txt directives and crawl delays, and only accesses publicly available content. | [View](https://www.criteo.com/criteo-crawler/) |
| customerio-webhooks | webhook | Customer.io's webhook service for event-driven marketing automation and customer data platform. | [View](https://docs.customer.io/integrations/data-out/connections/webhook/) |
| cybaa-agent | verification | Performs user-initiated security checks on behalf of Cybaa customers, validating security headers, TLS/SSL configuration, and other domain-specific security controls to ensure website compliance and protection. | [View](https://cybaa.io/bot-policy) |
| dash0-synthetic | monitor | Dash0's Synthetic Monitoring provides proactive, automated insights into the availability and performance of your websites and APIs. | [View](https://www.dash0.com/documentation/) |
| datadog-synthetic-monitoring-robot | monitor | Datadog's automated monitoring service that performs synthetic tests to verify website availability and performance. | [View](https://docs.datadoghq.com/synthetics/guide/identify_synthetics_bots/) |
| dataforseobot | search\_engine\_optimization | DataForSeoBot is a backlink checker bot operated by DataForSEO that crawls websites to build and maintain their backlink database. The bot respects robots.txt directives and crawl delays, and is used to provide SEO data and analytics services. | [View](https://dataforseo.com/dataforseo-bot) |
| detectify | monitor | Detectify is a web security scanner that performs automated security tests on web applications and attack surface monitoring. | [View](https://support.detectify.com/support/solutions/articles/48001049001-how-do-i-allow-detectify-to-scan-my-assets-) |
| duckassistbot | ai\_assistant | DuckAssistBot is a web crawler for DuckDuckGo Search that crawls pages in real-time for AI-assisted answers, which prominently cite their sources. This data is not used in any way to train AI models. | [View](https://duckduckgo.com/duckduckgo-help-pages/results/duckassistbot) |
| duckduckbot | search\_engine\_crawler | DuckDuckBot is a web crawler for DuckDuckGo. DuckDuckBot's job is to constantly improve search results and offer users the best and most secure search experience possible. | [View](https://duckduckgo.com/duckduckgo-help-pages/results/duckduckbot) |
| facebook-webhooks | webhook | Facebook's webhook service that delivers real-time event notifications for Meta platform events and changes. | [View](https://developers.facebook.com/docs/graph-api/webhooks/) |
| facebookexternalhit | preview | Fetches content for shared links on Meta platforms to generate rich previews. | [View](https://developers.facebook.com/docs/sharing/webmasters/web-crawlers/) |
| falbot | webhook | fal.ai's webhook service that delivers asynchronous notifications for AI model processing and generation tasks. | [View](https://docs.fal.ai/model-apis/model-endpoints/webhooks/#_top) |
| geedoproductsearchbot | ecommerce | GeedoProductSearch is a web crawler operated by Geedo SIA that indexes product information from e-commerce websites. The crawler respects robots.txt directives and can be configured for crawl speed and behavior through standard crawl-delay settings. | [View](https://geedo.com/product-search.html) |
| gemini-deep-research | ai\_assistant | Gemini Deep Research is Google's AI-powered research tool that performs comprehensive multi-step research on complex topics, analyzing web content to provide detailed insights and answers. | [View](https://gemini.google/overview/deep-research/) |
| github-camo | preview | GitHub's image proxy service | [View](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/about-anonymized-urls) |
| github-hookshot | webhook | GitHub's webhooks for events like push, pull request, etc. | [View](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/about-githubs-ip-addresses) |
| google-admob-reward-verification | webhook | Sends server-side verification callbacks to confirm users completed rewarded ad views. | [View](https://support.google.com/admob/answer/9603226?hl=en) |
| google-ads-creatives-assistant | ai\_assistant | Fetches website content for Google Ads creative generation and enhancement tools. | [View](https://support.google.com/google-ads/answer/15701616?hl=en) |
| google-adsbot | advertising | Google AdsBot is Google's web crawler for quality control of Google Ads. | [View](https://developers.google.com/search/docs/crawling-indexing/overview-google-crawlers) |
| google-adwords-instant | advertising | Fetches advertiser landing pages when triggered by user actions in the Google Ads platform. | [View](https://developers.google.com/search/docs/crawling-indexing/overview-google-crawlers) |
| google-agent | agent | Google-Agent navigates the web and performs actions upon user request, used by agents hosted on Google infrastructure such as Project Mariner. | [View](https://developers.google.com/crawling/docs/crawlers-fetchers/google-agent) |
| google-association-service | verification | Verifies associations between apps and websites for Digital Asset Links. | [View](https://developers.google.com/digital-asset-links/v1/getting-started) |
| google-businesslink-verification | verification | Verifies that business links in Google Business Profile are accessible and return valid HTTP status codes. | [View](https://support.google.com/business/answer/13769188) |
| google-cloudvertexbot | ai\_assistant | Crawling preferences addressed to the Google-CloudVertexBot user agent affect crawls requested by the site owners' for building Vertex AI Agents. It has no effect on Google Search or other products. | [View](https://developers.google.com/search/docs/crawling-indexing/overview-google-crawlers) |
| google-display-ads-bot | advertising | Verifies site eligibility during the AdSense approval process. | [View](https://support.google.com/adsense/answer/99376?hl=en) |
| google-docs | preview | Fetches images and page content when users insert links into Google Docs. | [View](https://support.google.com/docs/?hl=en#topic=1382883) |
| google-extended | ai\_crawler | Google-Extended is a standalone product token that web publishers can use to manage whether their sites help improve Gemini Apps and Vertex AI generative APIs, including future generations of models that power those products. Grounding with Google Search on Vertex AI does not use web pages for grounding that have disallowed Google-Extended. Google-Extended does not impact a site's inclusion or ranking in Google Search. | [View](https://developers.google.com/search/docs/crawling-indexing/overview-google-crawlers) |
| google-feedfetcher | feed\_fetcher | Feedfetcher is used for crawling RSS or Atom feeds for Google News and PubSubHubbub. | [View](https://developers.google.com/search/docs/crawling-indexing/overview-google-crawlers) |
| google-image-proxy | preview | Google's image caching proxy service used by Gmail and other Google services to cache and serve images. | [View](https://developers.google.com/search/docs/crawling-indexing/google-user-triggered-fetchers) |
| google-inspectiontool | monitor | Crawling preferences addressed to the Google-InspectionTool user agent affect Search testing tools such as the Rich Result Test and URL inspection in Search Console. It has no effect on Google Search or other products. | [View](https://developers.google.com/search/docs/crawling-indexing/overview-google-crawlers) |
| google-pagerenderer | preview | Upon user request, Google Page Renderer fetches and renders web pages. | [View](https://developers.google.com/search/docs/crawling-indexing/overview-google-crawlers) |
| google-publisher-center | feed\_fetcher | Google Publisher Center fetches and processes feeds that publishers explicitly supplied for use in Google News landing pages. | [View](https://developers.google.com/search/docs/crawling-indexing/overview-google-crawlers) |
| google-read-aloud | accessibility | Upon user request, Google Read Aloud fetches and reads out web pages using text-to-speech (TTS). | [View](https://developers.google.com/search/docs/crawling-indexing/overview-google-crawlers) |
| google-safety | monitor | The Google-Safety user agent handles abuse-specific crawling, such as malware discovery for publicly posted links on Google properties. As such it's unaffected by crawling preferences. | [View](https://developers.google.com/search/docs/crawling-indexing/overview-google-crawlers) |
| google-site-verifier | verification | Google Site Verifier fetches Search Console verification tokens. | [View](https://developers.google.com/search/docs/crawling-indexing/overview-google-crawlers) |
| google-storebot | ecommerce | Crawling preferences addressed to the Storebot-Google user agent affect all surfaces of Google Shopping (for example, the Shopping tab in Google Search and Google Shopping). | [View](https://developers.google.com/search/docs/crawling-indexing/overview-google-crawlers) |
| googlebot | search\_engine\_crawler | Crawling preferences addressed to the Googlebot user agent affect Google Search (including Discover and all Google Search features), as well as other products such as Google Images, Google Video, Google News, and Discover. | [View](https://developers.google.com/search/docs/crawling-indexing/overview-google-crawlers) |
| googleother | search\_engine\_crawler | Crawling preferences addressed to the GoogleOther user agent don't affect any specific product. GoogleOther is the generic crawler that may be used by various product teams for fetching publicly accessible content from sites. For example, it may be used for one-off crawls for internal research and development. It has no effect on Google Search or other products. | [View](https://developers.google.com/search/docs/crawling-indexing/overview-google-crawlers) |
| gpt-actions | ai\_assistant | Enables ChatGPT to interact with external APIs and retrieve real-time information from the web in response to user-initiated requests; allows access to up-to-date content without being used for automated crawling or AI training. | [View](https://platform.openai.com/docs/actions/introduction) |
| gptbot | ai\_crawler | Crawls web content to improve OpenAI's generative AI models and ChatGPT; respects 'robots.txt' directives to exclude sites from training data. | [View](https://platform.openai.com/docs/bots) |
| gtmetrix | monitor | GTmetrix provides metrics and insights for your site's loading speed and performance. | [View](https://gtmetrix.com/features.html) |
| hetrixtools-uptime-monitoring-bot | monitor | HetrixTools Uptime Monitoring Bot is used by HetrixTools's monitoring services to perform various checks on websites, including uptime and performance monitoring. | [View](https://docs.hetrixtools.com/avoid-getting-our-ips-blocked/) |
| hookdeck | webhook | A reliable Event Gateway for event-driven applications | [View](https://hookdeck.com/docs) |
| hydrozen | monitor | Hydrozen is a tool for monitoring availability of your websites, Cronjobs, APIs, Domains, SSL etc. | [View](https://docs.hydrozen.io/overview/misc/user-agent-and-ip-list) |
| iframely | preview | Fetches your page metadata to generate rich link previews when users share your links across apps, blogs, and news sites, enhancing content visibility and engagement. | [View](https://iframely.com/docs/about) |
| imagesiftbot | ai\_crawler | ImageSiftBot is a web crawler that scrapes the internet for publicly available images to support Hive's suite of web intelligence products. | [View](https://imagesift.com/about) |
| inngest | webhook | Inngest is a platform for building event-driven applications. | [View](https://www.inngest.com/docs/platform/webhooks) |
| jobswithgpt | search\_engine\_crawler | Crawls job-related pages to power jobswithgpt.com, a platform for discovering AI-enhanced career opportunities. | [View](https://jobswithgpt.com/bot.html) |
| kakaotalk-scrap | preview | Fetches Open Graph metadata and images from URLs shared in KakaoTalk to generate mobile-optimized link previews. | [View](https://devtalk.kakao.com/t/scrap/33984) |
| kernel-searchbot | ai\_crawler | Crawls public web pages to build Kernel's search index, which Kernel customers query through their AI agents. | [View](https://kernel.sh/docs/bots) |
| kernel | ai\_crawler | Runs browser automation on behalf of Kernel customers for web agents, automations, and web scraping. | [View](https://www.kernel.sh/docs) |
| linkedinbot | preview | LinkedInBot is a bot that renders links shared on LinkedIn. | [View](https://www.linkedin.com/robots.txt) |
| logicmonitor | monitor | LogicMonitor SiteMonitor monitors your website's uptime, performance, and availability from multiple global regions. | [View](https://www.logicmonitor.com/support/data-monitored-for-websites) |
| lumar | search\_engine\_optimization | The Lumar website intelligence platform is used by SEO, engineering, marketing and digital operations teams to monitor the performance of their site's technical health, and ensure a high-performing, revenue-driving website. | [View](https://www.lumar.io/spdr/) |
| marfeel-audits | monitor | Marfeel's audit crawlers that periodically re-crawl traffic-receiving URLs to detect structured data, meta tags, and HTML issues. | [View](https://community.marfeel.com/t/marfeel-crawlers/5966) |
| marfeel-flowcards | preview | Marfeel's crawler that fetches content for Flowcards that load directly from specific URLs. | [View](https://community.marfeel.com/t/marfeel-crawlers/5966) |
| marfeel-preview | preview | Marfeel's previewer crawler used to render preview experiences for both mobile and desktop views. | [View](https://community.marfeel.com/t/marfeel-crawlers/5966) |
| marfeel-social | social\_media | Marfeel's crawler used for social experiences (Facebook, X/Twitter, Telegram, Reddit, LinkedIn). | [View](https://community.marfeel.com/t/marfeel-crawlers/5966) |
| meta-externalads | advertising | Crawls the web to improve advertising and business-related products and services. | [View](https://developers.facebook.com/docs/sharing/webmasters/web-crawlers/) |
| meta-externalagent | ai\_crawler | The Meta-ExternalAgent crawler crawls the web for use cases such as training AI models or improving products by indexing content directly. | [View](https://developers.facebook.com/docs/sharing/webmasters/web-crawlers/) |
| meta-externalfetcher | user\_initiated | The Meta-ExternalFetcher crawler performs user-initiated fetches of individual links to support specific product functions. Because the fetch was initiated by a user, this crawler may bypass robots.txt rules. | [View](https://developers.facebook.com/docs/sharing/webmasters/web-crawlers/) |
| meta-webindexer | ai\_crawler | Crawls web content to provide search results for Meta AI users. | [View](https://developers.facebook.com/docs/sharing/webmasters/web-crawlers/) |
| microsoftpreview | preview | MicrosoftPreview generates page snapshots for Microsoft products. It has desktop and mobile variants, with Chrome version dynamically updated to match the latest Microsoft Edge version. | [View](https://www.bing.com/webmasters/help/which-crawlers-does-bing-use-8c184ec0) |
| momenticbot | user\_initiated | Momentic is a AI-powered platform for software testing. It allows you to write reliable end-to-end tests for web apps in a simple and intuitive way using natural language. | [View](https://momentic.ai/docs/quickstart/cloud) |
| adsnaver | search\_engine\_crawler | Naver's ad crawler that periodically visits registered ad landing pages to collect on-page content for effective ad matching and ranking. It ignores robots.txt for URLs registered in the ad system. | [View](https://ads.naver.com/help/faq) |
| naver-blueno | preview | Naver's preview-snippet crawler that fetches summary information (titles, descriptions, images) when users insert links in Naver services such as blogs or cafés. It operates on demand and respects robots.txt. | [View](https://help.naver.com/service/5626/contents/19008?lang=ko) |
| naverbot | search\_engine\_crawler | Naver's web crawler (also known as Yeti) is used by Naver, South Korea's largest search engine, to crawl and index web content. | [View](https://searchadvisor.naver.com/guide) |
| newrelic-minions | monitor | New Relic Synthetic monitoring infrastructure that performs API checks and virtual browser instances to monitor websites and applications from global locations | [View](https://docs.newrelic.com/docs/synthetics/synthetic-monitoring/administration/synthetic-public-minion-ips) |
| oai-adsbot | advertising | Validates the safety of web pages submitted as ads on ChatGPT; data collected is not used to train generative AI foundation models. | [View](https://platform.openai.com/docs/bots) |
| oai-searchbot | ai\_assistant | Indexes websites for inclusion in ChatGPT's search results; does not crawl content for AI model training. | [View](https://platform.openai.com/docs/bots) |
| ohdearbot | monitor | OhDearBot is a monitoring bot operated by Oh Dear that performs uptime checks, broken link detection, and mixed content scanning. The bot follows standard crawling practices and throttles requests to minimize server impact. | [View](https://ohdear.app/docs/faq/what-ips-does-oh-dear-monitor-from) |
| paypal | webhook | PayPal delivers real-time event notifications for payments, subscriptions, and account updates. | [View](https://developer.paypal.com/api/rest/webhooks/) |
| perplexity-user | ai\_assistant | Handles user-initiated requests in Perplexity, accessing external content to provide real-time information; not used for automated crawling or AI training. | [View](https://docs.perplexity.ai/guides/bots) |
| perplexitybot | ai\_assistant | Indexes websites for inclusion in Perplexity's search results; does not crawl content for AI model training. | [View](https://docs.perplexity.ai/guides/bots) |
| petalbot | search\_engine\_crawler | PetalBot is a web crawler operated by Huawei's Petal Search engine. It crawls both PC and mobile websites to build an index database for Petal search engine and to provide content recommendations for Huawei Assistant and AI Search services. | [View](https://webmaster.petalsearch.com/site/petalbot) |
| pingdom-bot | monitor | Pingdom Bot is used by Pingdom's monitoring services to perform various checks on websites, including uptime and performance monitoring. | [View](https://documentation.solarwinds.com/en/success_center/pingdom/content/topics/pingdom-probe-servers-ip-addresses.htm) |
| pinterest-bot | search\_engine\_crawler | Pinterest's web crawler that indexes content for their platform. It crawls websites to collect metadata for Pins, including images, titles, descriptions, and prices. The crawler also helps maintain Pin data accuracy and detect broken links. | [View](https://help.pinterest.com/en/business/article/pinterestbot) |
| polar-webhooks | webhook | Polar's webhook service delivers real-time event notifications for payment processing, including purchases, subscriptions, cancellations, and refunds. | [View](https://polar.sh/docs/integrate/webhooks/endpoints) |
| pulsepoint-crawler | advertising | A web crawler used by PulsePoint, a digital advertising technology company, for content indexing and ads.txt verification. | [View](https://www.pulsepoint.com/) |
| qatech | monitor | The QA.tech web agent browses the website and identifies potential test cases, and executes tests against a web application | [View](https://docs.qa.tech) |
| qstash | webhook | QStash is a platform for building event-driven applications. | [View](https://upstash.com/docs/qstash/howto/signature) |
| quantcastbot | advertising | Quantcast Bot is a web crawler used for advertisement quality assurance and to understand page content for Interest-Based Audiences. | [View](https://www.quantcast.com/bot) |
| qwantbot | search\_engine\_crawler | Crawls and indexes web content for Qwant search engine. | [View](https://help.qwant.com/bot/) |
| razorpay-webhook | webhook | Razorpay's webhooks enable merchants to receive secure, real-time HTTP callbacks for key payment events—automating reconciliation, notifications, and downstream workflows. | [View](https://razorpay.com/docs/webhooks/) |
| redirect-pizza | monitor | redirect.pizza's destination monitor ensures that the redirect destination URLs are reachable. | [View](https://redirect.pizza/support/broken-destination-monitoring) |
| amazon-route-53-health-check-service | monitor | Amazon Route 53 Health Check Service | [View](https://repost.aws/knowledge-center/route-53-fix-unwanted-health-checks) |
| ryebot | ecommerce | Powers automated checkout on behalf of shoppers with explicit consent. | [View](https://docs.rye.com/api-v2-experimental/ryebot) |
| sanity-webhooks | webhook | Sanity's webhook service that delivers real-time event notifications for content changes and other events. | [View](https://www.sanity.io/docs/webhooks) |
| sansec-security-monitor | monitor | Sansec Security Monitor is a web crawler that monitors online stores for malicious code, data breaches, and digital skimming attacks. | [View](https://sansec.io/monitor) |
| seekportbot | search\_engine\_crawler | SeekportBot is the web crawler for Seekport, a German search engine operated by SISTRIX. The bot crawls and indexes web content while respecting robots.txt directives and crawl delays. | [View](https://bot.seekport.com/) |
| semrush-site-audit | search\_engine\_optimization | Semrush Site Audit is a powerful website crawler that analyzes the health of a website by checking for on-page and technical SEO issues, including duplicate content, broken links, HTTPS implementation, hreflang attributes, and more. | [View](https://www.semrush.com/bot/) |
| semrush | search\_engine\_optimization | Semrush is a platform for SEO, content marketing, competitor research, PPC and social media marketing. | [View](https://www.semrush.com/bot/) |
| sentry-uptime-monitoring-bot | monitor | Sentry's Uptime Monitoring Bot performs health checks on configured URLs to monitor the availability and reliability of web services. | [View](https://docs.sentry.io/product/alerts/uptime-monitoring/troubleshooting/) |
| seobility | search\_engine\_crawler | Seobility is a browser-based online SEO software that helps you improve your website's search engine rankings. | [View](https://www.seobility.net/en/faq/?category=website-crawling#aboutourbot) |
| seranking-backlinks | search\_engine\_optimization | SE Ranking's backlink analysis crawler that discovers and analyzes backlink profiles for SEO research and competitive analysis. | [View](https://seranking.com/backlinks-crawler) |
| seznambot | search\_engine\_crawler | SeznamBot is the web crawler operated by Seznam.cz, the leading Czech search engine. The bot crawls and indexes web content for Seznam's search results, respecting robots.txt directives and crawl delays. | [View](https://o-seznam.cz/napoveda/vyhledavani/en/seznambot-crawler/) |
| shapbot | ai\_crawler | Crawls and indexes web content to power Parallel's search and content extraction APIs for AI applications. | [View](https://docs.parallel.ai/resources/crawler) |
| site24x7 | monitor | Site24x7 Bot is used by Site24x7's monitoring services to perform various checks on websites, including uptime and performance monitoring. | [View](https://www.site24x7.com/multi-location-web-site-monitoring.html) |
| stably | monitor | Stably is a QA testing bot that users run to E2E test their websites for functionality testing and protecting user flows against regressions. | [View](https://docs.stably.ai/trouble-shooting/allowlist-stably#stably-ip-allowlist) |
| statuscake-pagespeed | monitor | StatusCake Page Speed monitors your page load and render speeds. | [View](https://www.statuscake.com/kb/knowledge-base/page-speed-f-a-q/) |
| statuscake-ssl | monitor | StatusCake SSL monitors your website certificates for common issues | [View](https://www.statuscake.com/kb/article-categories/ssl-monitoring/) |
| statuscake-uptime | monitor | StatusCake monitors the uptime of your website. | [View](https://www.statuscake.com/kb/article-categories/testing/) |
| stripe-webhooks | webhook | Stripe's webhook service that delivers real-time event notifications for payment processing and account updates. | [View](https://docs.stripe.com/ips) |
| stripebot | analytics | Crawls Stripe merchant websites to collect data for service delivery and financial regulatory compliance. | [View](https://docs.stripe.com/stripebot-crawler) |
| svix | webhook | svix is a webhook service for sending events to webhooks. | [View](https://docs.svix.com/receiving/source-ips) |
| termlybot | monitor | Crawls websites to detect and categorize cookies set by first and third parties. | [View](https://termly.io/bot/) |
| twitterbot | preview | Fetches content for shared links on X/Twitter to generate rich previews. | [View](https://developer.x.com/en/docs/x-for-websites/cards/guides/troubleshooting-cards) |
| updown-io | monitor | Performs uptime and performance checks on websites. | [View](https://updown.io/about) |
| uptime-robot | monitor | Uptime Robot is a platform for monitoring and alerting on your applications. | [View](https://uptimerobot.com/help/locations/) |
| v0bot | ai\_crawler | Bot for v0 services. |  |
| vemetric-favicon-bot | preview | Fetches favicons from websites in the highest quality available. | [View](https://vemetric.com/favicon-api) |
| vercel-build-container | preview | System-initiated requests made from Vercel's build container during a build | [View](https://vercel.com/docs/builds) |
| vercel-favicon-bot | preview | Vercel Favicon Bot | [View](https://vercel.com/docs) |
| vercelflags | monitor | vercel flags | [View](https://vercel.com/docs/feature-flags/flags-explorer) |
| vercel-screenshot-bot | preview | Vercel Screenshot Bot | [View](https://vercel.com/docs) |
| verceltracing | monitor | vercel tracing | [View](https://vercel.com/docs/tracing) |
| yahoo-ad-monitoring | advertising | Yahoo Ad Monitoring crawls landing pages of URLs listed with Yahoo advertising services to analyze content quality, ensure ad relevance, and improve user experience by maintaining accurate ad listings. | [View](https://help.yahoo.com/kb/yahoo-ad-monitoring-SLN24857.html) |
| yahoo-slurp | search\_engine\_crawler | Yahoo! Slurp is the web crawler (robot) used by Yahoo! Search to discover and index web pages for its search engine. | [View](https://help.yahoo.com/kb/SLN22600.html) |
| yandexbot | search\_engine\_crawler | YandexBot is a web crawler operated by Yandex, a major Russian search engine. | [View](https://yandex.com/support/webmaster/robot-workings/check-yandex-robots.html) |

## Related Vercel documentation

Cross-link map: Bot Management (/docs/bot-management)

> From the Vercel docs graph (built 2026-08-24T05:25:56.064Z), spanning vercel.com docs + KB, nextjs.org, ai-sdk.dev, and other Vercel documentation sites. Full graph as JSON: [https://vercel.com/docs/graph.json](https://vercel.com/docs/graph.json)

### Semantically closest pages

- [How to Utilize Vercel's Bot Management Features](https://vercel.com/kb/guide/how-to-utilize-vercels-bot-management-features?from=graph) — A practical, step-by-step guide to identifying unwanted automated traffic and securing your Vercel apps with Bot Protect
- [How to protect your AI app from bots](https://vercel.com/kb/guide/how-to-protect-your-ai-app-from-bots?from=graph) — Learn how to protect your AI app from bots, scrapers, and abuse using Firewall, BotID, and more.
- [BotID](https://vercel.com/docs/botid?from=graph) — Protect your applications from automated attacks with intelligent bot detection and verification, powered by Kasada.
- [How to protect your AI endpoints with Vercel BotID](https://vercel.com/kb/guide/protect-ai-endpoints-with-vercel-botid?from=graph) — Gate every request to your AI endpoints with Vercel BotID and checkBotId\(\) so inference runs only for verified callers
- [How to block bots from OpenAI GPTBot](https://vercel.com/kb/guide/how-to-block-bots-openai-gptbot?from=graph) — Learn how to use the Vercel WAF to block, rate limit, or challenge traffic from OpenAI GPTBot.

### This page links to (9)

- [Overview](https://vercel.com/docs/observability?from=graph) — Observability on Vercel provides framework-aware insights enabling you to optimize infrastructure and application perfor
- [Reverse Proxy Servers and Vercel](https://vercel.com/docs/security/reverse-proxy?from=graph) — Learn why reverse proxy servers are not recommended with Vercel's firewall.
- [Attack Mode](https://vercel.com/docs/vercel-firewall/attack-mode?from=graph) — Learn how to use Attack Mode to help control who has access to your site when it's under attack.
- [DDoS Mitigation](https://vercel.com/docs/vercel-firewall/ddos-mitigation?from=graph) — Learn how the Vercel Firewall mitigates against DoS and DDoS attacks
- [Firewall Concepts](https://vercel.com/docs/vercel-firewall/firewall-concepts?from=graph) — Understand the fundamentals behind the Vercel Firewall.
- [Firewall Observability](https://vercel.com/docs/vercel-firewall/firewall-observability?from=graph) — Learn how firewall traffic monitoring and alerts help you react quickly to potential security threats.
- [Custom Rules](https://vercel.com/docs/vercel-firewall/vercel-waf/custom-rules?from=graph) — Learn how to add and manage custom rules to configure the Vercel Web Application Firewall \(WAF\).
- [Examples](https://vercel.com/docs/vercel-firewall/vercel-waf/examples?from=graph) — Learn how to use Vercel WAF to protect your site in specific situations.
- [WAF Managed Rulesets](https://vercel.com/docs/vercel-firewall/vercel-waf/managed-rulesets?from=graph) — Learn how to use WAF Managed Rulesets with the Vercel Web Application Firewall \(WAF\)

### Pages that link here (21)

By site: vercel-kb (11) · vercel-docs (10)

#### From vercel-kb

- [How to prepare your storefront for Black Friday traffic](https://vercel.com/kb/guide/black-friday-preparation?from=graph) — A practical checklist for keeping your storefront fast and your checkout path healthy through Black Friday and Cyber Mon
- [Should I use Cloudflare in front of Vercel?](https://vercel.com/kb/guide/cloudflare-with-vercel?from=graph) — Information on using Cloudflare together with Vercel.
- [How to Effectively Load Test Your Vercel Application](https://vercel.com/kb/guide/how-to-effectively-load-test-your-vercel-application?from=graph) — Learn how to safely load test your Next.js app on Vercel. This guide covers realistic, policy-compliant testing of route
- [How to protect your AI app from bots](https://vercel.com/kb/guide/how-to-protect-your-ai-app-from-bots?from=graph) — Learn how to protect your AI app from bots, scrapers, and abuse using Firewall, BotID, and more.
- [How to Utilize Vercel's Bot Management Features](https://vercel.com/kb/guide/how-to-utilize-vercels-bot-management-features?from=graph) — A practical, step-by-step guide to identifying unwanted automated traffic and securing your Vercel apps with Bot Protect
- [Vercel vs Akamai](https://vercel.com/kb/guide/vercel-vs-akamai?from=graph) — A detailed guide to Vercel vs Akamai: compute models, AI infrastructure, framework support, media streaming, CDN capabil
- [Vercel vs Fastly](https://vercel.com/kb/guide/vercel-vs-fastly?from=graph) — A detailed guide to Vercel vs Fastly: full-stack application platform vs edge infrastructure layer, covering framework s
- [Vercel vs Netlify](https://vercel.com/kb/guide/vercel-vs-netlify?from=graph) — A detailed guide to Vercel vs Netlify: runtimes, compute architecture, AI infrastructure, security, and when to choose e
- [Vercel vs Northflank](https://vercel.com/kb/guide/vercel-vs-northflank?from=graph) — A detailed guide to Vercel vs Northflank: Fluid compute, CDN and caching, security defaults, AI infrastructure, GPU comp
- [Vercel vs Railway](https://vercel.com/kb/guide/vercel-vs-railway?from=graph) — A detailed guide to Vercel vs Railway: serverless vs always-on containers, container images via Dockerfile.vercel, frame
- [Vercel vs Render](https://vercel.com/kb/guide/vercel-vs-render?from=graph) — A detailed guide to Vercel vs Render: compute models, AI infrastructure, Docker support, background workers, and when to

#### From vercel-docs

- [Handling Verified Bots](https://vercel.com/docs/botid/verified-bots?from=graph) — Information about verified bots and their handling in BotID
- [Security](https://vercel.com/docs/cdn-security?from=graph) — Learn how Vercel's CDN secures every request with HTTPS, TLS, DDoS mitigation, firewall protection, and security headers
- [vercel firewall](https://vercel.com/docs/cli/firewall?from=graph) — Learn how to manage your project's custom firewall rules, IP blocks, system bypass rules, attack challenge mode, and sys
- [Protection Bypass for Automation](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation?from=graph) — Learn how to bypass Vercel Deployment Protection for automated tooling \(e.g. E2E testing\).
- [Glossary](https://vercel.com/docs/glossary?from=graph) — Learn about the terms and concepts used in Vercel's products and documentation.
- [How Vercel CDN works](https://vercel.com/docs/how-vercel-cdn-works?from=graph) — Learn how Vercel's CDN processes requests through routing, caching, and compute layers to deliver your content with low
- [Products](https://vercel.com/docs/products?from=graph) — Explore all Vercel products and capabilities.
- [sitemap.md](https://vercel.com/docs/sitemap.md?from=graph) — Learn about sitemap.md on Vercel.
- [Attack Mode](https://vercel.com/docs/vercel-firewall/attack-mode?from=graph) — Learn how to use Attack Mode to help control who has access to your site when it's under attack.
- [WAF Managed Rulesets](https://vercel.com/docs/vercel-firewall/vercel-waf/managed-rulesets?from=graph) — Learn how to use WAF Managed Rulesets with the Vercel Web Application Firewall \(WAF\)
