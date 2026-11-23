"""
KEYFLOW Phase 7.31: Owner Clerk ID Configuration Parsing & Owner Authorization Tests
=====================================================================================
Covers:
1. Plain single Clerk ID parsing: 'user_xxx' -> ['user_xxx'].
2. Multiple comma-separated IDs parsing: 'user_1, user_2' -> ['user_1', 'user_2'].
3. JSON array string parsing: '["user_1", "user_2"]' -> ['user_1', 'user_2'].
4. Empty / whitespace configuration parsing -> [].
5. None configuration parsing -> [].
6. Accidental brackets/quotes stripping on individual tokens.
7. Live Owner authentication with plain single ID.
8. Live Owner authentication with JSON array configuration.
9. Fail-closed behavior when Production OWNER_CLERK_IDS is empty ([]).
10. Rejection when unrelated Clerk ID attempts to claim Owner email.
"""

from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from rest_framework.exceptions import AuthenticationFailed

from keyflow.settings import parse_owner_clerk_ids
from accounts.authentication import resolve_clerk_identity
from accounts.models import ROLE_SUPER_ADMIN, ROLE_USER

User = get_user_model()


class OwnerClerkIdParserTests(TestCase):
    """Unit tests for parse_owner_clerk_ids helper function."""

    def test_plain_single_id(self):
        res = parse_owner_clerk_ids('user_2abc123')
        self.assertEqual(res, ['user_2abc123'])

    def test_plain_single_id_with_whitespace(self):
        res = parse_owner_clerk_ids('   user_2abc123   ')
        self.assertEqual(res, ['user_2abc123'])

    def test_comma_separated_multiple_ids(self):
        res = parse_owner_clerk_ids('user_1, user_2, user_3')
        self.assertEqual(res, ['user_1', 'user_2', 'user_3'])

    def test_json_array_format(self):
        res = parse_owner_clerk_ids('["user_PROD_OWNER_ID"]')
        self.assertEqual(res, ['user_PROD_OWNER_ID'])

    def test_json_array_multiple_elements(self):
        res = parse_owner_clerk_ids('["user_owner_a", "user_owner_b"]')
        self.assertEqual(res, ['user_owner_a', 'user_owner_b'])

    def test_accidental_quoted_single_id(self):
        res = parse_owner_clerk_ids('"user_2abc123"')
        self.assertEqual(res, ['user_2abc123'])

    def test_empty_string(self):
        res = parse_owner_clerk_ids('')
        self.assertEqual(res, [])

    def test_whitespace_only(self):
        res = parse_owner_clerk_ids('   ')
        self.assertEqual(res, [])

    def test_none_value(self):
        res = parse_owner_clerk_ids(None)
        self.assertEqual(res, [])


class OwnerAuthenticationConfigTests(TestCase):
    """Integration tests for resolve_clerk_identity under different OWNER_CLERK_IDS formats."""

    def setUp(self):
        User.objects.all().delete()

    # 1. Plain single Clerk ID grants Owner access
    @override_settings(
        OWNER_EMAIL='sina44n07@gmail.com',
        OWNER_CLERK_IDS=['user_prod_owner_single'],
    )
    def test_plain_single_clerk_id_authenticates_owner(self):
        user = resolve_clerk_identity({
            'sub': 'user_prod_owner_single',
            'email': 'sina44n07@gmail.com',
            'name': 'Platform Owner',
        })
        self.assertEqual(user.email, 'sina44n07@gmail.com')
        self.assertEqual(user.clerk_id, 'user_prod_owner_single')
        self.assertEqual(user.role, ROLE_SUPER_ADMIN)
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)
        self.assertTrue(user.is_owner)

    # 2. JSON-parsed Clerk ID list grants Owner access
    @override_settings(
        OWNER_EMAIL='sina44n07@gmail.com',
        OWNER_CLERK_IDS=parse_owner_clerk_ids('["user_prod_owner_json"]'),
    )
    def test_json_formatted_clerk_id_authenticates_owner(self):
        user = resolve_clerk_identity({
            'sub': 'user_prod_owner_json',
            'email': 'sina44n07@gmail.com',
            'name': 'Platform Owner',
        })
        self.assertEqual(user.email, 'sina44n07@gmail.com')
        self.assertEqual(user.clerk_id, 'user_prod_owner_json')
        self.assertEqual(user.role, ROLE_SUPER_ADMIN)
        self.assertTrue(user.is_owner)

    # 3. Empty production configuration fails closed
    @override_settings(
        OWNER_EMAIL='sina44n07@gmail.com',
        OWNER_CLERK_IDS=[],
    )
    def test_empty_production_config_fails_closed(self):
        with self.assertRaises(AuthenticationFailed) as ctx:
            resolve_clerk_identity({
                'sub': 'user_any_unverified_clerk_id',
                'email': 'sina44n07@gmail.com',
            })
        self.assertIn('Unauthorized identity attempting to', str(ctx.exception))

    # 4. Unrelated Clerk ID presenting Owner email is rejected
    @override_settings(
        OWNER_EMAIL='sina44n07@gmail.com',
        OWNER_CLERK_IDS=['user_legit_owner_clerk'],
    )
    def test_unrelated_clerk_id_claiming_owner_email_is_rejected(self):
        with self.assertRaises(AuthenticationFailed) as ctx:
            resolve_clerk_identity({
                'sub': 'user_rogue_intruder_999',
                'email': 'sina44n07@gmail.com',
            })
        self.assertIn('Unauthorized identity attempting to', str(ctx.exception))

    # 5. Non-owner presenting owner Clerk ID is rejected
    @override_settings(
        OWNER_EMAIL='sina44n07@gmail.com',
        OWNER_CLERK_IDS=['user_legit_owner_clerk'],
    )
    def test_non_owner_email_claiming_owner_clerk_id_is_rejected(self):
        with self.assertRaises(AuthenticationFailed) as ctx:
            resolve_clerk_identity({
                'sub': 'user_legit_owner_clerk',
                'email': 'intruder@example.com',
            })
        self.assertIn('Conflicting identity', str(ctx.exception))
