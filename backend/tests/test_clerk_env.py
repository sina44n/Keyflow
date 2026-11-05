"""
Tests for Clerk Backend Environment Configuration and Security Hardening
========================================================================
"""

from django.test import TestCase
from accounts.clerk_env import (
    get_clerk_domain_from_publishable_key,
    get_clerk_key_type,
    validate_clerk_backend_configuration,
)


class ClerkEnvironmentTests(TestCase):
    def test_domain_derivation_from_publishable_key(self):
        # Development key: new-kitten-8257.clerk.accounts.dev$
        dev_pk = "pk_test_bmV3LWtpdHRlbi04MjU3LmNsZXJrLmFjY291bnRzLmRldiQ"
        domain = get_clerk_domain_from_publishable_key(dev_pk)
        self.assertEqual(domain, "new-kitten-8257.clerk.accounts.dev")

        # Invalid keys
        self.assertIsNone(get_clerk_domain_from_publishable_key(""))
        self.assertIsNone(get_clerk_domain_from_publishable_key(None))
        self.assertIsNone(get_clerk_domain_from_publishable_key("invalid_prefix_123"))

    def test_key_type_detection(self):
        self.assertEqual(get_clerk_key_type("pk_test_abc"), "test")
        self.assertEqual(get_clerk_key_type("sk_test_xyz"), "test")
        self.assertEqual(get_clerk_key_type("pk_live_abc"), "live")
        self.assertEqual(get_clerk_key_type("sk_live_xyz"), "live")
        self.assertEqual(get_clerk_key_type("invalid_key"), "invalid")
        self.assertEqual(get_clerk_key_type(""), "empty")
        self.assertEqual(get_clerk_key_type(None), "empty")

    def test_matching_dev_keys_validated_as_development(self):
        result = validate_clerk_backend_configuration({
            'CLERK_PUBLISHABLE_KEY': 'pk_test_bmV3LWtpdHRlbi04MjU3LmNsZXJrLmFjY291bnRzLmRldiQ',
            'CLERK_SECRET_KEY': 'sk_test_dummySecret123',
            'DEBUG': True,
        })
        self.assertTrue(result['is_configured'])
        self.assertEqual(result['instance_type'], 'development')
        self.assertEqual(len(result['errors']), 0)
        self.assertEqual(result['derived_domain'], 'new-kitten-8257.clerk.accounts.dev')
        self.assertEqual(result['effective_issuer'], 'https://new-kitten-8257.clerk.accounts.dev')
        self.assertEqual(result['effective_jwks_url'], 'https://new-kitten-8257.clerk.accounts.dev/.well-known/jwks.json')

    def test_matching_live_keys_validated_as_production(self):
        result = validate_clerk_backend_configuration({
            'CLERK_PUBLISHABLE_KEY': 'pk_live_Y2xlcmsua2V5Zmxvdy5hcHAk',
            'CLERK_SECRET_KEY': 'sk_live_dummyProdSecret456',
            'DEBUG': False,
        })
        self.assertTrue(result['is_configured'])
        self.assertEqual(result['instance_type'], 'production')
        self.assertEqual(len(result['errors']), 0)
        self.assertEqual(len(result['warnings']), 0)

    def test_key_mismatch_detected(self):
        result = validate_clerk_backend_configuration({
            'CLERK_PUBLISHABLE_KEY': 'pk_live_Y2xlcmsua2V5Zmxvdy5hcHAk',
            'CLERK_SECRET_KEY': 'sk_test_dummyDevSecret123',
            'DEBUG': True,
        })
        self.assertTrue(len(result['errors']) > 0)
        self.assertTrue(any('mismatch' in err.lower() for err in result['errors']))

    def test_production_with_test_keys_triggers_security_warning(self):
        result = validate_clerk_backend_configuration({
            'CLERK_PUBLISHABLE_KEY': 'pk_test_bmV3LWtpdHRlbi04MjU3LmNsZXJrLmFjY291bnRzLmRldiQ',
            'CLERK_SECRET_KEY': 'sk_test_dummySecret123',
            'DEBUG': False,  # Simulating production with DEBUG=False
        })
        self.assertTrue(len(result['warnings']) > 0)
        self.assertTrue(any('security warning' in warn.lower() for warn in result['warnings']))
