"""Pipeline Scheduler - APScheduler + job queue"""

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
import asyncio
import structlog
from scraper import VLRScraper
from transformer import DataTransformer

logger = structlog.get_logger()


class PipelineScheduler:
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.scraper = VLRScraper()
        self.transformer = DataTransformer()

    async def daily_vlr_scrape(self):
        """Daily VLR.gg scrape - events/matches"""
        logger.info("Starting daily VLR scrape")
        try:
            async with self.scraper as scraper:
                # Scrape recent events (last 7 days)
                matches = await scraper.scrape_event_matches("2183")  # VCT 2024
                normalized = self.transformer.batch_normalize(matches)
                # Save to DB
                logger.info("Scraped & normalized", count=len(matches))
        except Exception as e:
            logger.error("Daily scrape failed", error=str(e))

    def start(self):
        """Start scheduler"""
        self.scheduler.add_job(
            self.daily_vlr_scrape,
            CronTrigger(hour=2, minute=0),  # 2AM UTC
            id="daily_vlr",
            replace_existing=True,
        )

        self.scheduler.add_job(
            self.weekly_full_harvest,
            CronTrigger(day_of_week="sun", hour=3, minute=0),
            id="weekly_full",
        )

        self.scheduler.start()
        logger.info("Pipeline scheduler started")

    async def weekly_full_harvest(self):
        """Weekly full dataset refresh"""
        logger.info("Starting weekly full harvest")
        # Full scrape + archive to GitHub/S3
        pass


async def main():
    scheduler = PipelineScheduler()
    scheduler.start()

    # Keep running
    while True:
        await asyncio.sleep(60)


if __name__ == "__main__":
    asyncio.run(main())
