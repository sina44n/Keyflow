# Generated for WebhookEventReceipt claim fencing in Phase 7.34

import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0013_webhookeventreceipt'),
    ]

    operations = [
        migrations.AddField(
            model_name='webhookeventreceipt',
            name='claim_token',
            field=models.UUIDField(db_index=True, default=uuid.uuid4),
        ),
        migrations.AddField(
            model_name='webhookeventreceipt',
            name='lease_expires_at',
            field=models.DateTimeField(blank=True, db_index=True, null=True),
        ),
    ]
