## Test suite for ExportClient with Feature Store API
## Run with: godot --headless --script test_export_client.gd

extends SceneTree

const ExportClient = preload("res://scripts/export/ExportClient.gd")

var _test_results: Dictionary = {"passed": 0, "failed": 0, "tests": []}
var _current_test: String = ""

func _init():
	print("=" * 60)
	print("ExportClient Test Suite")
	print("Testing integration with eSports-EXE Feature Store API")
	print("=" * 60)
	
	# Run all tests
	await test_basic_configuration()
	await test_send_match_data()
	await test_retry_logic()
	await test_offline_queue()
	await test_queue_persistence()
	await test_feature_store_integration()
	
	# Print results
	_print_results()
	quit()

func _print_results():
	print("\n" + "=" * 60)
	print("Test Results")
	print("=" * 60)
	print("Passed: %d" % _test_results.passed)
	print("Failed: %d" % _test_results.failed)
	print("Total:  %d" % (_test_results.passed + _test_results.failed))
	
	if _test_results.failed > 0:
		print("\nFailed tests:")
		for test in _test_results.tests:
			if not test.passed:
				print("  - %s: %s" % [test.name, test.error])
	
	print("=" * 60)

func _start_test(test_name: String):
	_current_test = test_name
	print("\n[Test] %s" % test_name)

func _pass_test():
	_test_results.passed += 1
	_test_results.tests.append({"name": _current_test, "passed": true})
	print("  ✓ PASSED")

func _fail_test(error: String):
	_test_results.failed += 1
	_test_results.tests.append({"name": _current_test, "passed": false, "error": error})
	print("  ✗ FAILED: %s" % error)

## Test 1: Basic Configuration
func test_basic_configuration():
	_start_test("Basic Configuration")
	
	var client = ExportClient.new()
	client.name = "TestExportClient"
	get_root().add_child(client)
	
	# Test initial state
	assert(client.api_endpoint == "")
	assert(client.api_key == "")
	assert(client.get_queue_size() == 0)
	
	# Test configuration
	client.configure("https://api.esports-exe.com/v1/features", "test_key_123")
	
	if client.api_endpoint != "https://api.esports-exe.com/v1/features":
		_fail_test("Endpoint not set correctly")
		return
	
	if client.api_key != "test_key_123":
		_fail_test("API key not set correctly")
		return
	
	_pass_test()
	client.queue_free()

## Test 2: Send Match Data
func test_send_match_data():
	_start_test("Send Match Data")
	
	var client = ExportClient.new()
	client.name = "TestExportClient"
	get_root().add_child(client)
	
	# Configure with local test endpoint
	client.configure("http://localhost:8000/v1/features/store", "test_key")
	
	# Create sample match data (Feature Store format)
	var match_data = {
		"match_id": "test_match_001",
		"timestamp": Time.get_datetime_string_from_system(true),
		"game_version": "1.0.0",
		"features": {
			"team_a_score": 13,
			"team_b_score": 10,
			"duration_seconds": 1800,
			"total_rounds": 23
		},
		"player_stats": [
			{
				"player_id": "player_1",
				"kills": 22,
				"deaths": 15,
				"adr": 182.5
			}
		]
	}
	
	# Since we don't have actual server, test that request is initiated
	var result = client.send_match_data(match_data)
	
	# Without server, this will queue for offline
	if not client.is_offline():
		_fail_test("Should be offline without server")
		return
	
	if client.get_queue_size() != 1:
		_fail_test("Data should be queued")
		return
	
	_pass_test()
	client.queue_free()

## Test 3: Retry Logic
func test_retry_logic():
	_start_test("Retry Logic")
	
	var client = ExportClient.new()
	client.name = "TestExportClient"
	client.max_retries = 2
	client.base_retry_delay = 0.1  # Fast for testing
	get_root().add_child(client)
	
	client.configure("http://invalid-endpoint:9999", "test_key")
	
	var match_data = {"test": "data"}
	client.send_match_data(match_data)
	
	# Wait for retries
	await create_timer(0.5).timeout
	
	# Should be in offline queue after retries
	if client.get_queue_size() != 1:
		_fail_test("Data should be queued after retries")
		return
	
	_pass_test()
	client.queue_free()

## Test 4: Offline Queue
func test_offline_queue():
	_start_test("Offline Queue")
	
	var client = ExportClient.new()
	client.name = "TestExportClient"
	get_root().add_child(client)
	
	# Don't configure endpoint - should queue
	var data1 = {"match_id": "001", "data": "first"}
	var data2 = {"match_id": "002", "data": "second"}
	
	client.send_match_data(data1)
	client.send_match_data(data2)
	
	if client.get_queue_size() != 2:
		_fail_test("Queue should have 2 items")
		return
	
	# Test queue contents
	var queue_contents = client.get_queue_contents()
	if queue_contents.size() != 2:
		_fail_test("Queue contents size mismatch")
		return
	
	# Test clear queue
	client.clear_queue()
	if client.get_queue_size() != 0:
		_fail_test("Queue should be empty after clear")
		return
	
	_pass_test()
	client.queue_free()

## Test 5: Queue Persistence
func test_queue_persistence():
	_start_test("Queue Persistence")
	
	var client1 = ExportClient.new()
	client1.name = "TestExportClient1"
	get_root().add_child(client1)
	
	# Add items to queue
	var data = {"match_id": "persistent_001", "test": true}
	client1._queue_offline(data)
	
	# Get queue contents
	var saved_queue = client1.get_queue_contents()
	
	# Create new client and restore
	var client2 = ExportClient.new()
	client2.name = "TestExportClient2"
	get_root().add_child(client2)
	
	client2.restore_queue(saved_queue)
	
	if client2.get_queue_size() != 1:
		_fail_test("Queue not restored correctly")
		return
	
	_pass_test()
	client1.queue_free()
	client2.queue_free()

## Test 6: Feature Store Integration (Mock)
func test_feature_store_integration():
	_start_test("Feature Store Integration")
	
	var client = ExportClient.new()
	client.name = "TestExportClient"
	get_root().add_child(client)
	
	# Configure for Feature Store API
	client.configure("http://localhost:8000/v1/features/store", "feature_store_key")
	
	# Create Feature Store compatible payload
	var feature_payload = {
		"entity_type": "match",
		"entity_id": "match_001",
		"feature_values": {
			"combat_score": 245.5,
			"tactical_score": 180.2,
			"economic_score": 195.0,
			"impact_score": 220.8,
			"consistency_score": 175.3
		},
		"timestamp": Time.get_datetime_string_from_system(true),
		"metadata": {
			"map": "ascent",
			"duration": 1800,
			"game_version": "1.0.0"
		}
	}
	
	# Send to Feature Store
	var result = client.send_match_data(feature_payload)
	
	# Without actual server, verify it was queued
	if client.get_queue_size() != 1:
		_fail_test("Feature data should be queued")
		return
	
	# Verify queue content structure
	var queue_contents = client.get_queue_contents()
	if queue_contents.size() == 0:
		_fail_test("Queue should not be empty")
		return
	
	var queued_payload = queue_contents[0].payload
	if not queued_payload.has("entity_type"):
		_fail_test("Payload missing entity_type")
		return
	
	if queued_payload.entity_type != "match":
		_fail_test("Entity type mismatch")
		return
	
	_pass_test()
	client.queue_free()

## Main test runner
func _ready():
	# Tests are run in _init
	pass
