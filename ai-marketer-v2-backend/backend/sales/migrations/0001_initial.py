# Generated by Django 5.1.6 on 2025-05-19 04:03

import django.db.models.deletion
import sales.models
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('businesses', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='SalesData',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('file', models.FileField(upload_to=sales.models.sales_file_path)),
                ('filename', models.CharField(max_length=255)),
                ('file_type', models.CharField(max_length=10)),
                ('uploaded_at', models.DateTimeField(auto_now_add=True)),
                ('processed', models.BooleanField(default=False)),
                ('processed_at', models.DateTimeField(blank=True, null=True)),
                ('business', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sales_data', to='businesses.business')),
            ],
            options={
                'ordering': ['-uploaded_at'],
            },
        ),
        migrations.CreateModel(
            name='SalesDataPoint',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateField()),
                ('revenue', models.DecimalField(decimal_places=2, max_digits=10)),
                ('source', models.CharField(choices=[('upload', 'Uploaded File'), ('square', 'Square Sync')], default='upload', max_length=10)),
                ('product_name', models.CharField(blank=True, max_length=255, null=True)),
                ('product_price', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('units_sold', models.IntegerField(default=1)),
                ('business', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='businesses.business')),
                ('source_file', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='sales.salesdata')),
            ],
            options={
                'unique_together': {('business', 'date', 'source', 'product_name', 'product_price')},
            },
        ),
    ]
