# Generated by Django 5.1.6 on 2025-05-19 04:03

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Business',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=32)),
                ('logo', models.CharField(blank=True, max_length=255, null=True)),
                ('category', models.CharField(blank=True, max_length=32, null=True)),
                ('target_customers', models.CharField(blank=True, max_length=32, null=True)),
                ('vibe', models.CharField(blank=True, max_length=32, null=True)),
                ('square_access_token', models.CharField(blank=True, max_length=255, null=True)),
                ('last_square_sync_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
        ),
    ]
