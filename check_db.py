#!/usr/bin/env python3
"""Database configuration verification script."""

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect, text

load_dotenv()
db_url = os.getenv('DATABASE_URL')

print('=' * 80)
print('DATABASE CONFIGURATION CHECK')
print('=' * 80)

print('\n1. DATABASE CONNECTION URL:')
if db_url:
    # Mask password for display
    masked_url = db_url.replace(db_url.split('@')[0].split(':')[-1], '****')
    print(f'   {masked_url}')
else:
    print('   ✗ DATABASE_URL not found in environment')
    exit(1)

print('\n2. TESTING CONNECTION...')
try:
    engine = create_engine(db_url, pool_pre_ping=True)
    with engine.connect() as conn:
        result = conn.execute(text('SELECT version()'))
        version = result.fetchone()[0]
        print('   ✓ Connection successful!')
        postgres_version = version.split('on')[0].strip()
        print(f'   PostgreSQL Version: {postgres_version}')
except Exception as e:
    print(f'   ✗ Connection failed: {e}')
    exit(1)

print('\n3. CHECKING TABLES...')
inspector = inspect(engine)
tables = inspector.get_table_names()
print(f'   Tables in database: {tables}')

hcp_ok = 'hcp' in tables
interaction_ok = 'interaction' in tables

if hcp_ok:
    print('   ✓ hcp table exists')
    hcp_columns = inspector.get_columns('hcp')
    print(f'     Columns: {[col["name"] for col in hcp_columns]}')
else:
    print('   ✗ hcp table NOT found')

if interaction_ok:
    print('   ✓ interaction table exists')
    interaction_columns = inspector.get_columns('interaction')
    print(f'     Columns: {[col["name"] for col in interaction_columns]}')
else:
    print('   ✗ interaction table NOT found')

print('\n4. CHECKING DATA...')
try:
    with engine.connect() as conn:
        hcp_count = conn.execute(text('SELECT COUNT(*) FROM hcp')).fetchone()[0]
        interaction_count = conn.execute(text('SELECT COUNT(*) FROM interaction')).fetchone()[0]
        
        print(f'   HCP Records: {hcp_count}')
        print(f'   Interaction Records: {interaction_count}')
        
        if hcp_count > 0:
            print('\n   HCP Sample Data:')
            result = conn.execute(text('SELECT id, doctor_name, hospital, specialization FROM hcp LIMIT 3'))
            for row in result:
                print(f'     - ID: {row[0]}, Doctor: {row[1]}, Hospital: {row[2]}, Spec: {row[3]}')
        
        if interaction_count > 0:
            print('\n   Interaction Sample Data:')
            result = conn.execute(text('SELECT id, hcp_id, meeting_date, outcome, samples_given FROM interaction LIMIT 3'))
            for row in result:
                print(f'     - ID: {row[0]}, HCP_ID: {row[1]}, Date: {row[2]}, Outcome: {row[3]}, Samples: {row[4]}')
except Exception as e:
    print(f'   ✗ Error checking data: {e}')

print('\n5. TABLE SCHEMAS:')
try:
    with engine.connect() as conn:
        # HCP schema
        result = conn.execute(text("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'hcp'
            ORDER BY ordinal_position
        """))
        print(f'\n   HCP Table Schema:')
        for row in result:
            nullable = 'NULL' if row[2] == 'YES' else 'NOT NULL'
            default = f'DEFAULT {row[3]}' if row[3] else ''
            print(f'     - {row[0]}: {row[1]} {nullable} {default}'.strip())
        
        # Interaction schema
        result = conn.execute(text("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'interaction'
            ORDER BY ordinal_position
        """))
        print(f'\n   Interaction Table Schema:')
        for row in result:
            nullable = 'NULL' if row[2] == 'YES' else 'NOT NULL'
            default = f'DEFAULT {row[3]}' if row[3] else ''
            print(f'     - {row[0]}: {row[1]} {nullable} {default}'.strip())
except Exception as e:
    print(f'   ✗ Error checking schema: {e}')

print('\n' + '=' * 80)
if hcp_ok and interaction_ok:
    print('✓ DATABASE CHECK COMPLETE - ALL OK')
else:
    print('✗ DATABASE CHECK COMPLETE - SOME ISSUES FOUND')
print('=' * 80)
