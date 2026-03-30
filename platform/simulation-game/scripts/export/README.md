# Godot Export Client for eSports-EXE

**Version:** 1.0.0  
**Component:** ExportClient.gd  
**Purpose:** HTTP client for exporting simulation data to eSports-EXE API

---

## Overview

ExportClient provides reliable HTTP communication between the Godot simulation and the eSports-EXE platform API. Features include:

- **Automatic Retry:** Exponential backoff with jitter
- **Offline Queue:** Failed requests queued for later retry
- **Authentication:** Bearer token support
- **Error Handling:** Comprehensive failure mode handling

---

## Usage

### Basic Export

```gdscript
extends Node

@onready var export_client = $ExportClient

func _ready():
    export_client.configure(
        "https://api.esports-exe.com/v1",
        "your_api_key"
    )
    export_client.request_completed.connect(_on_export_complete)

func export_match_data(match_data: Dictionary):
    export_client.send_match_data(match_data)

func _on_export_complete(success: bool, response: Dictionary):
    if success:
        print("Export successful!")
    else:
        print("Export failed, queued for retry")
```

### Configuration

| Property | Default | Description |
|----------|---------|-------------|
| `request_timeout` | 30.0 | HTTP timeout in seconds |
| `max_retries` | 3 | Maximum retry attempts |
| `base_retry_delay` | 1.0 | Initial retry delay (seconds) |
| `max_retry_delay` | 60.0 | Maximum retry delay (seconds) |

---

## Features

### Retry Logic

- Exponential backoff: `delay = base_delay * 2^(attempt-1)`
- Jitter: Random 0-1s added to prevent thundering herd
- Max delay clamping: Prevents excessive wait times

### Offline Mode

When API is unavailable:

1. Requests queued in memory
2. Queue persisted across sessions (via save/load)
3. Automatic flush when connection restored

```gdscript
# Check if offline
if export_client.is_offline():
    print("Queued requests:", export_client.get_queue_size())

# Save queue to file
var queue_data = export_client.get_queue_contents()
# ... save to file ...

# Restore queue
export_client.restore_queue(saved_queue_data)
```

---

## Signals

| Signal | Parameters | Description |
|--------|------------|-------------|
| `request_completed` | `success: bool, response: Dictionary` | Export completed |
| `queue_flushed` | none | All queued items processed |

---

## Integration with eSports-EXE

### API Endpoints

```gdscript
# Feature Store
export_client.api_endpoint = "https://api.esports-exe.com/v1/features"

# Model Registry  
export_client.api_endpoint = "https://api.esports-exe.com/v1/models"

# Analytics
export_client.api_endpoint = "https://api.esports-exe.com/v1/analytics"
```

---

## License

Part of eSports-EXE - MIT License
