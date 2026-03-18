"""S3/Cloud Storage for cold backups (Parquet + Zstd)
Compatible with AWS S3 or Supabase Storage
"""

import boto3
from botocore.exceptions import ClientError, NoCredentialsError
import pandas as pd
from io import BytesIO
import pyarrow.parquet as pq
from typing import List, Dict
from datetime import datetime
import structlog
import os

logger = structlog.get_logger()


class S3Backup:
    def __init__(self, bucket: str, endpoint: str = None):
        self.bucket = bucket
        self.endpoint = endpoint

        self.s3 = boto3.client(
            "s3",
            endpoint_url=endpoint,
            aws_access_key_id=os.getenv("S3_ACCESS_KEY"),
            aws_secret_access_key=os.getenv("S3_SECRET_KEY"),
        )

    def backup_table(self, table_name: str, data: List[Dict]) -> str:
        """Backup as compressed Parquet"""
        try:
            df = pd.DataFrame(data)

            # Parquet with Zstd compression
            buffer = BytesIO()
            table = pa.Table.from_pandas(df)
            pq.write_table(table, buffer, compression="zstd")
            buffer.seek(0)

            key = f"backups/{table_name}/{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.parquet"

            self.s3.put_object(
                Bucket=self.bucket,
                Key=key,
                Body=buffer.getvalue(),
                Metadata={
                    "table": table_name,
                    "records": str(len(data)),
                    "exported-at": datetime.utcnow().isoformat(),
                    "compression": "zstd",
                },
            )

            logger.info(
                "S3 backup complete",
                key=key,
                records=len(data),
                size=len(buffer.getvalue()),
            )
            return key

        except NoCredentialsError:
            logger.error("S3 credentials missing")
            raise
        except ClientError as e:
            logger.error("S3 client error", error=str(e))
            raise

    def restore_table(self, key: str) -> pd.DataFrame:
        """Restore Parquet from S3"""
        try:
            obj = self.s3.get_object(Bucket=self.bucket, Key=key)
            df = pd.read_parquet(BytesIO(obj["Body"].read()))
            logger.info("S3 restore complete", key=key, records=len(df))
            return df
        except ClientError as e:
            logger.error("S3 restore failed", error=str(e))
            raise


if __name__ == "__main__":
    backup = S3Backup(bucket="libre-x-data-backup")

    sample_data = [
        {"match_id": "123", "team": "Sentinels", "score": 13},
        {"match_id": "124", "team": "Gen.G", "score": 11},
    ]

    key = backup.backup_table("matches", sample_data)
    print(f"Backed up to: s3://{backup.bucket}/{key}")

    restored = backup.restore_table(key)
    print("Restored data:", restored)
