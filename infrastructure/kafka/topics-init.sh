#!/bin/bash
# Initialize Kafka Topics for NJZ Platform

set -e

KAFKA_BROKER="localhost:9092"

echo "Initializing Kafka topics..."

# Core event topics
kafka-topics --bootstrap-server $KAFKA_BROKER --create --if-not-exists \
    --topic matches.raw --partitions 6 --replication-factor 1

echo "Created: matches.raw"

kafka-topics --bootstrap-server $KAFKA_BROKER --create --if-not-exists \
    --topic matches.processed --partitions 6 --replication-factor 1

echo "Created: matches.processed"

kafka-topics --bootstrap-server $KAFKA_BROKER --create --if-not-exists \
    --topic players.stats --partitions 6 --replication-factor 1

echo "Created: players.stats"

kafka-topics --bootstrap-server $KAFKA_BROKER --create --if-not-exists \
    --topic simrating.recalc --partitions 6 --replication-factor 1

echo "Created: simrating.recalc"

kafka-topics --bootstrap-server $KAFKA_BROKER --create --if-not-exists \
    --topic simulation.requests --partitions 6 --replication-factor 1

echo "Created: simulation.requests"

kafka-topics --bootstrap-server $KAFKA_BROKER --create --if-not-exists \
    --topic dlq.errors --partitions 3 --replication-factor 1

echo "Created: dlq.errors"

echo "All topics created successfully!"
