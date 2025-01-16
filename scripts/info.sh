#!/bin/bash

cd ..
circuit_output=$(bb gates -b target/zkemail_test.json | grep "circuit_size")

echo "circuit size: $circuit_output"