# Generated for WebhookEventReceipt model in Phase 7.32

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0012_revokedclerkidentity'),
    ]

    operations = [
        migrations.CreateModel(
            name='WebhookEventReceipt',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('svix_id', models.CharField(db_index=True, max_length=255, unique=True)),
                ('event_type', models.CharField(db_index=True, max_length=100)),
                ('status', models.CharField(choices=[('PROCESSING', 'Processing'), ('PROCESSED', 'Processed'), ('FAILED', 'Failed')], db_index=True, default='PROCESSING', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('processed_at', models.DateTimeField(blank=True, null=True)),
                ('error_message', models.TextField(blank=True, default='')),
            ],
            options={
                'verbose_name': 'Webhook Event Receipt',
                'verbose_name_plural': 'Webhook Event Receipts',
                'db_table': 'auth_webhook_event_receipts',
                'ordering': ['-created_at'],
            },
        ),
    ]
