#!/usr/bin/env python3
"""
Extract matches from VLR.gg.

Usage:
    python -m extraction.scripts.extract_matches --epoch=3 --mode=delta
    python -m extraction.scripts.extract_matches --match-id=12345 --match-id=12346
    python -m extraction.scripts.extract_matches --dry-run --epoch=2
"""
import argparse
import asyncio
import json
import logging
import sys
from pathlib import Path

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from extraction.src.scrapers.vlr_client import VLRClient
from extraction.src.scrapers.vlr_resilient_client import ResilientVLRClient
from extraction.src.scrapers.epoch_harvester import EpochHarvester
from extraction.src.parsers.match_parser import MatchParser
from extraction.src.parsers.content_drift_detector import ContentDriftDetector
from extraction.src.storage.known_record_registry import KnownRecordRegistry

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def extract_single_match(match_id: str, use_resilient: bool = True) -> dict:
    """Extract a single match by ID."""
    logger.info(f"Extracting match {match_id}...")
    
    client_class = ResilientVLRClient if use_resilient else VLRClient
    
    async with client_class() as client:
        if use_resilient:
            response = await client.ethical_fetch(f"https://www.vlr.gg/{match_id}")
            html = response.raw_html
        else:
            html, _ = await client.fetch_match(match_id)
        
        parser = MatchParser()
        data = parser.parse(html, match_id)
        
        if data:
            return {
                'success': True,
                'match_id': match_id,
                'data': {
                    'vlr_match_id': data.vlr_match_id,
                    'tournament': data.tournament,
                    'map_name': data.map_name,
                    'match_date': data.match_date,
                    'patch_version': data.patch_version,
                    'player_count': len(data.players),
                    'players': data.players[:3] if data.players else [],  # Sample
                }
            }
        else:
            return {
                'success': False,
                'match_id': match_id,
                'error': 'Failed to parse match data'
            }


async def extract_matches(args):
    """Main extraction logic."""
    results = []
    
    if args.match_id:
        # Extract specific matches
        for match_id in args.match_id:
            try:
                result = await extract_single_match(match_id, not args.no_resilient)
                results.append(result)
                
                if args.dry_run:
                    print(json.dumps(result, indent=2))
                    
            except Exception as e:
                logger.error(f"Failed to extract match {match_id}: {e}")
                results.append({
                    'success': False,
                    'match_id': match_id,
                    'error': str(e)
                })
    
    elif args.epoch:
        # Run epoch harvester
        logger.info(f"Running epoch harvester for epochs {args.epoch} (mode={args.mode})")
        
        registry = KnownRecordRegistry() if not args.no_registry else None
        harvester = EpochHarvester(
            mode=args.mode,
            epochs=args.epoch,
            max_concurrent=args.max_concurrent,
            registry=registry,
        )
        
        if args.dry_run:
            logger.info("Dry run mode - would harvest the following epochs:")
            for epoch_num in args.epoch:
                from extraction.src.scrapers.epoch_harvester import EPOCHS
                config = EPOCHS[epoch_num]
                logger.info(f"  Epoch {epoch_num}: {config['start']} to {config['end']}")
            return
        
        totals = await harvester.run()
        
        for epoch_num, count in totals.items():
            logger.info(f"Epoch {epoch_num}: {count} records harvested")
            results.append({
                'epoch': epoch_num,
                'records_harvested': count,
            })
    
    else:
        logger.error("Must specify either --match-id or --epoch")
        return 1
    
    # Output summary
    success_count = sum(1 for r in results if r.get('success', True))
    total_count = len(results)
    logger.info(f"Extraction complete: {success_count}/{total_count} successful")
    
    if args.output:
        with open(args.output, 'w') as f:
            json.dump(results, f, indent=2)
        logger.info(f"Results written to {args.output}")
    
    return 0


def main():
    parser = argparse.ArgumentParser(
        description="Extract match data from VLR.gg",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Extract specific matches
  python -m extraction.scripts.extract_matches --match-id 12345 --match-id 12346
  
  # Harvest epoch 3 (current) in delta mode
  python -m extraction.scripts.extract_matches --epoch 3 --mode delta
  
  # Dry run to see what would be harvested
  python -m extraction.scripts.extract_matches --epoch 1 2 3 --dry-run
  
  # Full harvest of all epochs
  python -m extraction.scripts.extract_matches --epoch 1 2 3 --mode full
        """
    )
    
    parser.add_argument(
        '--match-id',
        type=str,
        nargs='+',
        help='Specific match ID(s) to extract'
    )
    parser.add_argument(
        '--epoch',
        type=int,
        nargs='+',
        choices=[1, 2, 3],
        help='Epoch number(s) to harvest (1=historic, 2=mature, 3=current)'
    )
    parser.add_argument(
        '--mode',
        choices=['delta', 'full'],
        default='delta',
        help='Harvest mode: delta (incremental) or full (complete refresh)'
    )
    parser.add_argument(
        '--max-concurrent',
        type=int,
        default=3,
        help='Maximum concurrent requests (default: 3)'
    )
    parser.add_argument(
        '--output',
        '-o',
        type=str,
        help='Output file for results (JSON)'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show what would be done without making changes'
    )
    parser.add_argument(
        '--no-resilient',
        action='store_true',
        help='Use basic VLRClient instead of ResilientVLRClient'
    )
    parser.add_argument(
        '--no-registry',
        action='store_true',
        help='Skip KnownRecordRegistry checks'
    )
    parser.add_argument(
        '-v', '--verbose',
        action='store_true',
        help='Enable verbose logging'
    )
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    try:
        exit_code = asyncio.run(extract_matches(args))
        sys.exit(exit_code)
    except KeyboardInterrupt:
        logger.info("Extraction interrupted by user")
        sys.exit(130)
    except Exception as e:
        logger.exception("Extraction failed")
        sys.exit(1)


if __name__ == '__main__':
    main()
