async function pageFunction(context) {
    const { page, request, log } = context;

    // Wait for the page to load by waiting for the presence of the .entry-title element
    try {
        await page.waitForSelector('.entry-title', { timeout: 5000 });
    } catch (error) {
        log.error(`Timeout waiting for .entry-title element on ${request.url}`);
        return null;
    }

    // Get the URL and post title using the new selector
    const url = await page.$eval('.entry-title a', (element) => element.href);
    const postTitle = await page.$eval('.entry-title a', (element) => element.textContent);

    // Click on the URL to navigate to the post page
    try {
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }), // Increase the timeout
            page.click('.entry-title a')
        ]);
    } catch (error) {
        log.error(`Navigation timeout exceeded on ${url}`);
        // Handle the error by returning the request back to the list/queue
        return context.enqueueRequest(request);
    }

    // Scrape the image source on the post page
    const imageSource = await page.$eval('img', (element) => element.getAttribute('src'));

    // Scrape the HTML content within .entry-content
    const htmlContent = await page.$eval('.entry-content', (element) => element.innerHTML);

    // Scrape the post date
    const postDate = await page.$eval('.post-date', (element) => element.textContent);

    const scrapedData = {
        url,
        postTitle,
        htmlContent,
        postDate,
        imageSource
    };

    log.info(`Scraped data from ${url}`);
    
    // Go back to the original page to continue scraping other posts
    await page.goBack();
    
    return scrapedData;
}
