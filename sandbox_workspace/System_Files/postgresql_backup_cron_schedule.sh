#!/bin/bash
pg_dump -U postgres sit_campus_db > /backup/sit_db_$(date +%F).sql
