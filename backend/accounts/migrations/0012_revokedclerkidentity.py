# Generated for RevokedClerkIdentity tombstone model in Phase 7.25

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0011_enforce_owner_isolation_and_demote_non_owners'),
    ]

    operations = [
        migrations.CreateModel(
            name='RevokedClerkIdentity',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('clerk_id', models.CharField(db_index=True, max_length=128, unique=True)),
                ('original_email', models.EmailField(db_index=True, max_length=254)),
                ('revoked_at', models.DateTimeField(auto_now_add=True)),
                ('revocation_reason', models.CharField(default='account_deletion', max_length=255)),
            ],
            options={
                'verbose_name': 'Revoked Clerk Identity',
                'verbose_name_plural': 'Revoked Clerk Identities',
                'db_table': 'auth_revoked_clerk_identities',
                'ordering': ['-revoked_at'],
            },
        ),
    ]
