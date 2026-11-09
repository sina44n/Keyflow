"""
KEYFLOW Database Configuration & Deployment Resilience Unit Tests
=================================================================
Validates database URL resolution and security guards across cloud platforms
(Render, Railway, Heroku, Docker) and local development environments.

Covers the complete 18-point verification matrix:
1. Standard DATABASE_URL resolution.
2. Render INTERNAL_DATABASE_URL fallback.
3. POSTGRES_URL fallback.
4. POSTGRESQL_URL fallback.
5. Empty environment variable rejection.
6. Double-quoted URL sanitization.
7. Single-quoted URL sanitization.
8. Surrounding whitespace sanitization.
9. Missing configuration handling.
10. Invalid scheme rejection.
11. Missing hostname rejection.
12. Missing database name rejection.
13. Malformed URL handling.
14. Environment variable priority.
15. Local .env compatibility.
16. Explicit SQLite local-development opt-in.
17. Production SQLite rejection.
18. Credential masking in error messages.
"""

import os
import pytest
from django.core.exceptions import ImproperlyConfigured
from keyflow.settings import (
    _resolve_database_url,
    validate_and_configure_database,
    _sanitize_env_value,
    SUPPORTED_DB_ENV_VARS,
)


class TestDatabaseConfiguration:
    """Complete 18-point test suite for KEYFLOW database resolution and validation."""

    @pytest.fixture(autouse=True)
    def clean_environment(self, monkeypatch):
        """Cleans all candidate database environment variables before and after each test."""
        for key in SUPPORTED_DB_ENV_VARS:
            monkeypatch.delenv(key, raising=False)
        for k in list(os.environ.keys()):
            if k.strip() in SUPPORTED_DB_ENV_VARS:
                monkeypatch.delenv(k, raising=False)

    # 1. Standard DATABASE_URL resolution
    def test_standard_database_url_resolution(self, monkeypatch):
        test_url = "postgresql://user:pass@render.internal:5432/keyflow_db"
        monkeypatch.setenv("DATABASE_URL", test_url)
        url, source, has_ws = _resolve_database_url()
        assert url == test_url
        assert source == "DATABASE_URL"
        assert has_ws is False

    # 2. Render INTERNAL_DATABASE_URL fallback
    def test_render_internal_database_url_fallback(self, monkeypatch):
        test_url = "postgresql://keyflow_user:pass@dpg-c123456:5432/keyflow"
        monkeypatch.setenv("INTERNAL_DATABASE_URL", test_url)
        url, source, has_ws = _resolve_database_url()
        assert url == test_url
        assert source == "INTERNAL_DATABASE_URL"
        assert has_ws is False

    # 3. POSTGRES_URL fallback
    def test_postgres_url_fallback(self, monkeypatch):
        test_url = "postgresql://user:pass@railway.internal:5432/railway"
        monkeypatch.setenv("POSTGRES_URL", test_url)
        url, source, has_ws = _resolve_database_url()
        assert url == test_url
        assert source == "POSTGRES_URL"
        assert has_ws is False

    # 4. POSTGRESQL_URL fallback
    def test_postgresql_url_fallback(self, monkeypatch):
        test_url = "postgresql://user:pass@cloud.internal:5432/clouddb"
        monkeypatch.setenv("POSTGRESQL_URL", test_url)
        url, source, has_ws = _resolve_database_url()
        assert url == test_url
        assert source == "POSTGRESQL_URL"
        assert has_ws is False

    # 5. Empty environment variable rejection
    def test_empty_environment_variable_rejection(self, monkeypatch):
        monkeypatch.setenv("DATABASE_URL", "   ")
        # Should not resolve empty strings as valid DATABASE_URL
        assert _sanitize_env_value("   ") is None
        with pytest.raises(ImproperlyConfigured) as exc_info:
            validate_and_configure_database(None)
        assert "No valid PostgreSQL database configuration was detected" in str(exc_info.value)

    # 6. Double-quoted URL sanitization
    def test_double_quoted_url_sanitization(self, monkeypatch):
        raw_url = "postgresql://user:pass@host:5432/db"
        monkeypatch.setenv("DATABASE_URL", f'"{raw_url}"')
        url, source, _ = _resolve_database_url()
        assert url == raw_url

    # 7. Single-quoted URL sanitization
    def test_single_quoted_url_sanitization(self, monkeypatch):
        raw_url = "postgresql://user:pass@host:5432/db"
        monkeypatch.setenv("DATABASE_URL", f"'{raw_url}'")
        url, source, _ = _resolve_database_url()
        assert url == raw_url

    # 8. Surrounding whitespace sanitization
    def test_surrounding_whitespace_sanitization(self, monkeypatch):
        raw_url = "postgresql://user:pass@host:5432/db"
        monkeypatch.setenv("DATABASE_URL", f"   \n\t{raw_url}   \n")
        url, source, _ = _resolve_database_url()
        assert url == raw_url

    # 9. Missing configuration handling
    def test_missing_configuration_handling(self):
        with pytest.raises(ImproperlyConfigured) as exc_info:
            validate_and_configure_database("")
        assert "KEYFLOW DATABASE CONFIGURATION ERROR" in str(exc_info.value)

    # 10. Invalid scheme rejection
    def test_invalid_scheme_rejection(self):
        with pytest.raises(ImproperlyConfigured) as exc_info:
            validate_and_configure_database("mysql://user:pass@localhost:3306/db")
        assert "Unsupported database scheme 'mysql'" in str(exc_info.value)

    # 11. Missing hostname rejection
    def test_missing_hostname_rejection(self):
        with pytest.raises(ImproperlyConfigured) as exc_info:
            validate_and_configure_database("postgresql:///keyflow_db")
        assert "Missing hostname" in str(exc_info.value)

    # 12. Missing database name rejection
    def test_missing_database_name_rejection(self):
        with pytest.raises(ImproperlyConfigured) as exc_info:
            validate_and_configure_database("postgresql://user:pass@host:5432/")
        assert "Missing database name" in str(exc_info.value)

    # 13. Malformed URL handling
    def test_malformed_url_handling(self):
        with pytest.raises(ImproperlyConfigured) as exc_info:
            validate_and_configure_database("not_a_url_at_all")
        assert "KEYFLOW DATABASE CONFIGURATION ERROR" in str(exc_info.value)

    # 14. Environment variable priority
    def test_environment_variable_priority(self, monkeypatch):
        # DATABASE_URL must take precedence over INTERNAL_DATABASE_URL and POSTGRES_URL
        url1 = "postgresql://primary:pass@host1:5432/db1"
        url2 = "postgresql://internal:pass@host2:5432/db2"
        url3 = "postgresql://postgres:pass@host3:5432/db3"
        monkeypatch.setenv("DATABASE_URL", url1)
        monkeypatch.setenv("INTERNAL_DATABASE_URL", url2)
        monkeypatch.setenv("POSTGRES_URL", url3)
        url, source, _ = _resolve_database_url()
        assert url == url1
        assert source == "DATABASE_URL"

        # Now remove DATABASE_URL -> INTERNAL_DATABASE_URL must take priority
        monkeypatch.delenv("DATABASE_URL")
        url, source, _ = _resolve_database_url()
        assert url == url2
        assert source == "INTERNAL_DATABASE_URL"

    # 15. Local .env compatibility
    def test_local_env_compatibility(self, monkeypatch):
        # When os.environ candidate vars are cleared, decouple finds local backend/.env
        url, source, _ = _resolve_database_url()
        assert url is not None
        assert "postgresql://" in url or "sqlite://" in url

    # 16. Explicit SQLite local-development opt-in
    def test_explicit_sqlite_local_dev_opt_in(self):
        # DEBUG=True permits SQLite
        db_cfg = validate_and_configure_database("sqlite:///./db.sqlite3", is_debug=True)
        assert db_cfg.get("ENGINE") == "django.db.backends.sqlite3"

    # 17. Production SQLite rejection
    def test_production_sqlite_rejection(self):
        # DEBUG=False strictly rejects SQLite
        with pytest.raises(ImproperlyConfigured) as exc_info:
            validate_and_configure_database("sqlite:///./db.sqlite3", is_debug=False)
        assert "SQLite is only permitted in local development" in str(exc_info.value)

    # 18. Credential masking in error messages
    def test_credential_masking_in_error_messages(self):
        sensitive_pass = "super_secret_p@ssw0rd_98765"
        sensitive_url = f"postgresql://keyflow_admin:{sensitive_pass}@db.render.internal:5432/"
        with pytest.raises(ImproperlyConfigured) as exc_info:
            validate_and_configure_database(sensitive_url)
        err_msg = str(exc_info.value)
        # Ensure the secret password was NEVER printed or included in the exception
        assert sensitive_pass not in err_msg
        assert "No credentials exposed" in err_msg
