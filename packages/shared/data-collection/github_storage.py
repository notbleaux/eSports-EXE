"""GitHub Repo Storage Backend
Store JSON snapshots in GitHub as cold storage
"""

import base64
import json
from datetime import datetime
from github import Github, InputFileContent
from typing import Any, Dict
import structlog

logger = structlog.get_logger()


class GitHubStorage:
    def __init__(self, token: str, repo_name: str = "libre-x-data-repo"):
        self.g = Github(token)
        self.repo = self.g.get_repo(repo_name)
        self.branch = "data-snapshots"

    def store_snapshot(self, tenet_id: str, table: str, data: list) -> str:
        """Store data snapshot as versioned JSON"""
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        path = f"data/{tenet_id}/{table}/{timestamp}.json"

        content = json.dumps(
            {
                "metadata": {
                    "tenet_id": tenet_id,
                    "table": table,
                    "exported_at": timestamp,
                    "count": len(data),
                    "schema_version": "2.1.0",
                },
                "data": data,
            },
            indent=2,
        )

        try:
            # Create file
            self.repo.create_file(
                path=path,
                message=f"📊 [{tenet_id}] {table}: {len(data)} records",
                content=base64.b64encode(content.encode("utf-8")).decode(),
                branch=self.branch,
            )
            logger.info("Snapshot stored", path=path, records=len(data))
            return path
        except Exception as e:
            logger.error("GitHub storage failed", error=str(e), path=path)
            raise

    def get_snapshot(
        self, tenet_id: str, table: str, date_prefix: str = ""
    ) -> Dict[str, Any]:
        """Retrieve snapshot by prefix"""
        try:
            path_pattern = f"data/{tenet_id}/{table}/"
            if date_prefix:
                path_pattern += f"{date_prefix}*"

            contents = self.repo.get_contents(path_pattern, ref=self.branch)
            if contents:
                latest = contents[0]
                content = base64.b64decode(latest.content).decode("utf-8")
                logger.info("Snapshot retrieved", path=latest.path)
                return json.loads(content)
            return {}
        except Exception as e:
            logger.error("Snapshot retrieval failed", error=str(e))
            return {}


# Integration example
if __name__ == "__main__":
    # GITHUB_TOKEN env required
    storage = GitHubStorage(token="your_token_here")

    sample_data = [
        {"match_id": "123", "team_a": "Sentinels", "team_b": "Gen.G", "score": "13-11"}
    ]

    path = storage.store_snapshot("valorant", "matches", sample_data)
    print(f"Stored at: {path}")

    snapshot = storage.get_snapshot("valorant", "matches")
    print("Retrieved:", snapshot)
