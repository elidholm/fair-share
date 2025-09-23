import os
import re
from pathlib import Path
from typing import Any, Dict, List, Tuple, Optional

DEPENDABOT_PATH = Path(os.getenv("DEPENDABOT_PATH", ".github/dependabot.yml"))

# Try to import yaml if available; if not, we'll do robust string assertions as a fallback.
try:
    import yaml  # type: ignore
    HAS_YAML = True
except ImportError:
    HAS_YAML = False


def _read_dependabot_text() -> str:
    assert DEPENDABOT_PATH.exists(), "Dependabot config not found at .github/dependabot.yml. Expected .github/dependabot.yml or .yaml"
    text = DEPENDABOT_PATH.read_text(encoding="utf-8")
    assert text.strip(), "Dependabot config is empty"
    return text


def _load_yaml() -> Dict[str, Any]:
    assert HAS_YAML, "PyYAML is not installed; install it or ensure repo includes it. Fallback tests cannot validate full structure."
    with DEPENDABOT_PATH.open("r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    assert isinstance(data, dict), "Top-level YAML must be a mapping/object"
    return data


def test_dependabot_file_exists_and_nonempty():
    # Happy path: ensure file exists and is non-empty
    _read_dependabot_text()


def test_yaml_is_well_formed_when_yaml_available():
    if not HAS_YAML:
        # Provide a meaningful skip message instead of hard failing
        import pytest  # type: ignore
        pytest.skip("PyYAML not available; skipping structural YAML validation")
    data = _load_yaml()
    # Basic schema checks
    assert "version" in data, "Missing 'version' key"
    assert data["version"] == 2, f"Expected version=2, got {data['version']!r}"
    assert "updates" in data and isinstance(data["updates"], list), "Missing or invalid 'updates' list"
    assert len(data["updates"]) >= 5, "Expected at least 5 update entries"


def _index_updates(updates: List[Dict[str, Any]]) -> Dict[Tuple[str, str], Dict[str, Any]]:
    idx: Dict[Tuple[str, str], Dict[str, Any]] = {}
    for u in updates:
        # defensive assertions
        assert isinstance(u, dict), f"Each update must be a mapping/object, got {type(u)}"
        pe = u.get("package-ecosystem")
        directory = u.get("directory")
        assert isinstance(pe, str) and pe, "Each update must have a non-empty 'package-ecosystem'"
        assert isinstance(directory, str) and directory, "Each update must have a non-empty 'directory'"
        key = (pe, directory)
        assert key not in idx, f"Duplicate update entry for {key}"
        idx[key] = u
    return idx


def _assert_schedule_weekly(u: Dict[str, Any]) -> None:
    schedule = u.get("schedule")
    assert isinstance(schedule, dict), "Each update must have 'schedule' mapping"
    assert schedule.get("interval") == "weekly", f"Expected schedule.interval='weekly', got {schedule.get('interval')!r}"


def _assert_commit_prefix(u: Dict[str, Any], expected_prefix: str, expected_prefix_dev: Optional[str] = None) -> None:
    cm = u.get("commit-message")
    assert isinstance(cm, dict), "Each update must have 'commit-message' mapping"
    assert cm.get("prefix") == expected_prefix, f"Expected commit-message.prefix={expected_prefix!r}, got {cm.get('prefix')!r}"
    if expected_prefix_dev is not None:
        assert cm.get("prefix-development") == expected_prefix_dev, f"Expected commit-message.prefix-development={expected_prefix_dev!r}, got {cm.get('prefix-development')!r}"


def test_updates_content_matches_expected_when_yaml_available():
    if not HAS_YAML:
        import pytest  # type: ignore
        pytest.skip("PyYAML not available; skipping deep YAML content validation")
    data = _load_yaml()
    updates = data["updates"]
    idx = _index_updates(updates)

    # Expected entries
    expected = [
        ("npm", "/frontend", "chore(frontend)", "chore(frontend-dev)"),
        ("npm", "/backend", "chore(backend)", "chore(backend-dev)"),
        ("docker", "/frontend", "chore(frontend-docker)", None),
        ("docker", "/backend", "chore(backend-docker)", None),
        ("github-actions", "/", "ci", None),
    ]

    for pe, directory, prefix, prefix_dev in expected:
        key = (pe, directory)
        assert key in idx, f"Missing update entry for {key}"
        u = idx[key]
        _assert_schedule_weekly(u)
        _assert_commit_prefix(u, prefix, prefix_dev)


def test_no_duplicate_package_ecosystem_directory_pairs_when_yaml_available():
    if not HAS_YAML:
        import pytest  # type: ignore
        pytest.skip("PyYAML not available; skipping duplicate check")
    data = _load_yaml()
    # _index_updates() already asserts duplicates; calling it is sufficient
    _ = _index_updates(data["updates"])


def test_textual_sanity_checks_without_yaml_dependency():
    """
    Fallback tests: even if PyYAML is unavailable, verify critical textual markers
    from the diff exist to catch regressions. These are not schema-level guarantees,
    but provide meaningful protection without extra dependencies.
    """
    text = _read_dependabot_text()

    # Ensure all package-ecosystem/directory pairs appear at least once
    must_have_patterns = [
        r'package-ecosystem:\s*"npm"\s*\n\s*directory:\s*"/frontend"',
        r'package-ecosystem:\s*"npm"\s*\n\s*directory:\s*"/backend"',
        r'package-ecosystem:\s*"docker"\s*\n\s*directory:\s*"/frontend"',
        r'package-ecosystem:\s*"docker"\s*\n\s*directory:\s*"/backend"',
        r'package-ecosystem:\s*"github-actions"\s*\n\s*directory:\s*"/"',
    ]
    for pat in must_have_patterns:
        assert re.search(pat, text, re.MULTILINE), f"Expected to find pattern: {pat}"

    # Check commit-message prefixes from the diff
    for expected in [
        'prefix: "chore(frontend)"',
        'prefix-development: "chore(frontend-dev)"',
        'prefix: "chore(backend)"',
        'prefix-development: "chore(backend-dev)"',
        'prefix: "chore(frontend-docker)"',
        'prefix: "chore(backend-docker)"',
        'prefix: "ci"',
    ]:
        assert expected in text, f"Missing commit-message value: {expected}"

    # All updates should be weekly
    weekly_count = len(re.findall(r'interval:\s*"weekly"', text))
    assert weekly_count >= 5, f"Expected at least 5 weekly schedules, found {weekly_count}"