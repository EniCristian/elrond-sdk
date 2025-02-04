#!/usr/bin/env bash

source "./shared.sh"

testAll() {
    source ./tests.sh && runShortTests
    source ./test_cli_wallet.sh && testAll
    source ./test_cli_contracts.sh && testAll
    source ./test_cli_validators.sh && testAll
    source ./test_cli_tx.sh && testAll
    source ./test_cli_config.sh && testAll
    source ./test_cli_network.sh && testAll
    source ./test_cli_cost.sh && testAll
}

testHighImportance() {
    source ./test_cli_validators.sh && testAll
    source ./test_cli_tx.sh && testAll
}
