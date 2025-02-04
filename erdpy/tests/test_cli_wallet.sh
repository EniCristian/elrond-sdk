#!/usr/bin/env bash

source "./shared.sh"

testAll() {
    testGeneration
    testBech32
}

testGeneration() {
    echo "testGeneration"
    ${ERDPY} wallet derive ./testdata-out/myaccount.pem
    assertFileExists "./testdata-out/myaccount.pem"
    echo "foo bar\n" | ${ERDPY} wallet derive --mnemonic ./testdata-out/myaccount-from-mnemonic.pem
    assertFileExists "./testdata-out/myaccount-from-mnemonic.pem"
}

testBech32() {
    echo "testBech32"
    ${ERDPY} wallet bech32 --encode 000000000000000005006e4f90488e27342f9a46e1809452c85ee7186566bd5e
    ${ERDPY} wallet bech32 --decode erd1qqqqqqqqqqqqqpgqde8eqjywyu6zlxjxuxqfg5kgtmn3setxh40qen8egy
}

