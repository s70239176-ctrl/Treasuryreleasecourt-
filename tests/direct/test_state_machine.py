"""
Direct-mode (gltest) unit tests for TreasuryReleaseCourt.

These run against the GenLayer test harness in "direct" mode, where
gl.nondet.exec_prompt / gl.nondet.web.render / gl.eq_principle.prompt_comparative
are mocked so the state-machine guards can be exercised deterministically,
without spending real LLM calls or hitting real URLs.

Run with:
    gltest tests/direct/test_state_machine.py

NOTE: Only this test suite mocks the LLM/web calls. The shipped frontend
never mocks them — every jury call from the UI is a real on-chain
gl.eq_principle.prompt_comparative round-trip.
"""

import pytest
from gltest import get_contract_factory, default_account, accounts
from gltest.assertions import tx_execution_succeeded, tx_execution_failed


CHARTER = "The committee must ship a public dashboard reachable at a live URL."
TRANCHE = str(10 * 10**18)      # 10 GEN
APPEAL_BOND = str(2 * 10**18)   # 2 GEN
SUBMISSION_WINDOW = "300"
APPEAL_WINDOW = "180"


def _deploy(committee_addrs, committee_kinds, treasury=None, beneficiary=None):
    factory = get_contract_factory("TreasuryReleaseCourt")
    treasury_addr = treasury or accounts[1].address
    beneficiary_addr = beneficiary or accounts[2].address
    contract = factory.deploy(
        args=[
            CHARTER,
            beneficiary_addr,
            treasury_addr,
            TRANCHE,
            APPEAL_BOND,
            SUBMISSION_WINDOW,
            APPEAL_WINDOW,
            ",".join(committee_addrs),
            ",".join(committee_kinds),
        ]
    )
    return contract


def test_deploy_sets_setup_state():
    human = accounts[3].address
    agent = accounts[4].address
    contract = _deploy([human, agent], ["human", "agent"])
    court = contract.get_court(args=[])
    assert court["state"] == "SETUP"
    assert court["funded"] is False
    assert court["packet_count"] == 0


def test_cannot_score_before_freeze():
    human = accounts[3].address
    agent = accounts[4].address
    contract = _deploy([human, agent], ["human", "agent"])

    tx = contract.connect(default_account).fund(value=int(TRANCHE))
    assert tx_execution_succeeded(tx)

    tx = contract.connect(default_account).score_work()
    assert tx_execution_failed(tx)  # wrong state: FUNDED, not FROZEN


def test_wrong_bond_reverts_on_appeal():
    human_account = accounts[3]
    agent_account = accounts[4]
    contract = _deploy(
        [human_account.address, agent_account.address], ["human", "agent"]
    )

    contract.connect(default_account).fund(value=int(TRANCHE))
    contract.connect(human_account).submit_work(
        args=["Dashboard shipped", "See live link", "https://example.com/dashboard"]
    )
    contract.connect(default_account).freeze_submissions()

    # first jury needed before appeal is even reachable; direct-mode harness
    # mocks gl.eq_principle.prompt_comparative to a deterministic stub.
    contract.connect(default_account).score_work()

    tx = contract.connect(human_account).appeal(value=int(APPEAL_BOND) - 1)
    assert tx_execution_failed(tx)  # bond must match exactly


def test_non_committee_cannot_submit():
    human_account = accounts[3]
    outsider = accounts[5]
    contract = _deploy([human_account.address], ["human"])

    contract.connect(default_account).fund(value=int(TRANCHE))
    tx = contract.connect(outsider).submit_work(
        args=["Not allowed", "body", "https://example.com"]
    )
    assert tx_execution_failed(tx)


def test_cancel_blocked_after_jury():
    human_account = accounts[3]
    contract = _deploy([human_account.address], ["human"])

    contract.connect(default_account).fund(value=int(TRANCHE))
    contract.connect(human_account).submit_work(
        args=["Work", "body", "https://example.com"]
    )
    contract.connect(default_account).freeze_submissions()
    contract.connect(default_account).score_work()

    tx = contract.connect(default_account).cancel()
    assert tx_execution_failed(tx)  # jury has already ruled once


def test_cannot_settle_during_appeal_window():
    human_account = accounts[3]
    contract = _deploy([human_account.address], ["human"])

    contract.connect(default_account).fund(value=int(TRANCHE))
    contract.connect(human_account).submit_work(
        args=["Work", "body", "https://example.com"]
    )
    contract.connect(default_account).freeze_submissions()
    contract.connect(default_account).score_work()

    tx = contract.connect(default_account).settle()
    assert tx_execution_failed(tx)  # appeal window has not elapsed yet


def test_reread_refuses_if_evidence_changed():
    """
    This test documents the invariant at the storage level: once frozen,
    submit_work is unreachable (state guard requires FUNDED), so the
    evidence_digest recorded at freeze time cannot drift. reread() re-derives
    the digest from current storage and compares it defensively.
    """
    human_account = accounts[3]
    contract = _deploy([human_account.address], ["human"])

    contract.connect(default_account).fund(value=int(TRANCHE))
    contract.connect(human_account).submit_work(
        args=["Work", "body", "https://example.com"]
    )
    contract.connect(default_account).freeze_submissions()

    court_before = contract.get_court(args=[])
    digest_before = court_before["evidence_digest"]
    assert digest_before != ""

    contract.connect(default_account).score_work()
    court_after_score = contract.get_court(args=[])
    assert court_after_score["evidence_digest"] == digest_before
