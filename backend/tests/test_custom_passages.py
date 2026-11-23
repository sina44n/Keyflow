"""
Tests for Custom Passage Backend Persistence & User Isolation.
==============================================================
Verifies:
1. Multi-paragraph custom passage persistence with intact newlines.
2. Support for 1,000+ word passages without truncation.
3. Strict user isolation: User B cannot read, update, or delete User A's passages.
4. Explicit deletion semantics.
5. Unauthenticated rejection.
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient
from practice.models import CustomPassage

User = get_user_model()


class CustomPassagePersistenceTests(TestCase):
    def setUp(self):
        self.user_a = User.objects.create_user(
            username='user_a',
            email='user_a@keyflow.app',
            password='Password123!',
        )
        self.user_b = User.objects.create_user(
            username='user_b',
            email='user_b@keyflow.app',
            password='Password123!',
        )

        self.client_a = APIClient()
        self.client_a.force_authenticate(user=self.user_a)

        self.client_b = APIClient()
        self.client_b.force_authenticate(user=self.user_b)

        self.anon_client = APIClient()

    def test_unauthenticated_requests_are_rejected(self):
        res = self.anon_client.get('/api/practice/custom-passages/')
        self.assertIn(res.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))

        res_post = self.anon_client.post('/api/practice/custom-passages/', {'text': 'Hello world'})
        self.assertIn(res_post.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))

    def test_multi_paragraph_custom_passage_creation_and_preservation(self):
        """Verifies multi-paragraph content with distinct linebreaks is preserved losslessly."""
        multi_para_text = (
            "Paragraph One: Touch typing relies on muscle memory rather than sight.\n\n"
            "Paragraph Two: By anchoring home-row keys (A S D F and J K L ;), fingers return to center.\n\n"
            "Paragraph Three: Consistency and cadence yield sustained velocity."
        )

        res = self.client_a.post('/api/practice/custom-passages/', {
            'title': 'Biomechanical Foundations',
            'text': multi_para_text,
        }, format='json')

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        data = res.data
        self.assertEqual(data['title'], 'Biomechanical Foundations')
        self.assertEqual(data['text'], multi_para_text)
        self.assertIn('\n\n', data['text'])
        self.assertGreater(data['word_count'], 20)

        # Confirm persisted in DB
        db_obj = CustomPassage.objects.get(id=data['id'])
        self.assertEqual(db_obj.user, self.user_a)
        self.assertEqual(db_obj.text, multi_para_text)

    def test_long_passage_1000_words_no_truncation(self):
        """Verifies a long passage containing >1,000 words is saved completely without truncation."""
        words = [f"word{i}" for i in range(1050)]
        long_text = " ".join(words)

        res = self.client_a.post('/api/practice/custom-passages/', {
            'title': 'Long 1050 Words Drill',
            'text': long_text,
        }, format='json')

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        data = res.data
        self.assertEqual(data['word_count'], 1050)
        self.assertEqual(data['text'], long_text)

        # Verify from database
        db_obj = CustomPassage.objects.get(id=data['id'])
        self.assertEqual(len(db_obj.text.split()), 1050)

    def test_strict_user_isolation(self):
        """User B cannot read, update, or delete User A's custom passages."""
        # Create passage under User A
        res_a = self.client_a.post('/api/practice/custom-passages/', {
            'title': "User A Private Drill",
            'text': "This is private content belonging exclusively to User A.",
        }, format='json')
        passage_id = res_a.data['id']

        # User B lists passages -> Should NOT contain User A's passage
        res_b_list = self.client_b.get('/api/practice/custom-passages/')
        self.assertEqual(res_b_list.status_code, status.HTTP_200_OK)
        b_ids = [item['id'] for item in res_b_list.data]
        self.assertNotIn(passage_id, b_ids)

        # User B direct GET detail -> 404
        res_b_get = self.client_b.get(f'/api/practice/custom-passages/{passage_id}/')
        self.assertEqual(res_b_get.status_code, status.HTTP_404_NOT_FOUND)

        # User B attempt to update -> 404
        res_b_put = self.client_b.put(f'/api/practice/custom-passages/{passage_id}/', {
            'title': 'Hacked Title',
            'text': 'Hacked Content',
        }, format='json')
        self.assertEqual(res_b_put.status_code, status.HTTP_404_NOT_FOUND)

        # User B attempt to delete -> 404
        res_b_del = self.client_b.delete(f'/api/practice/custom-passages/{passage_id}/')
        self.assertEqual(res_b_del.status_code, status.HTTP_404_NOT_FOUND)

        # Confirm User A's passage remains intact in database
        self.assertTrue(CustomPassage.objects.filter(id=passage_id).exists())

    def test_explicit_deletion_by_owner(self):
        """Owner can explicitly delete their own passage."""
        res_create = self.client_a.post('/api/practice/custom-passages/', {
            'title': "Temporary Drill",
            'text': "To be deleted explicitly.",
        }, format='json')
        passage_id = res_create.data['id']

        res_del = self.client_a.delete(f'/api/practice/custom-passages/{passage_id}/')
        self.assertEqual(res_del.status_code, status.HTTP_204_NO_CONTENT)

        # Confirm deleted from DB
        self.assertFalse(CustomPassage.objects.filter(id=passage_id).exists())
