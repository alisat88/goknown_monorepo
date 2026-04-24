#!/bin/bash

# Fix database - Run migrations to create tables

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Fixing Database - Running Migrations${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${YELLOW}Step 1: Checking if 'users' table exists...${NC}"
USERS_TABLE_EXISTS=$(sudo docker exec goknown-postgres psql -U root -d defaultdb -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users');" 2>/dev/null | tr -d ' ' || echo "f")

if [ "$USERS_TABLE_EXISTS" = "t" ]; then
    echo -e "${GREEN}✓ 'users' table exists${NC}"
    echo ""
    echo -e "${GREEN}Database appears to be set up correctly!${NC}"
    exit 0
else
    echo -e "${RED}✗ 'users' table does NOT exist${NC}"
    echo ""
fi

echo -e "${YELLOW}Step 2: Checking migrations table...${NC}"
MIGRATIONS_EXISTS=$(sudo docker exec goknown-postgres psql -U root -d defaultdb -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'migrations');" 2>/dev/null | tr -d ' ' || echo "f")

if [ "$MIGRATIONS_EXISTS" = "t" ]; then
    MIGRATIONS_COUNT=$(sudo docker exec goknown-postgres psql -U root -d defaultdb -t -c "SELECT COUNT(*) FROM migrations;" 2>/dev/null | tr -d ' ' || echo "0")
    echo "Migrations table exists with $MIGRATIONS_COUNT records"
    
    if [ "$MIGRATIONS_COUNT" -gt 0 ]; then
        echo -e "${YELLOW}⚠️  Migrations are recorded but tables don't exist${NC}"
        echo -e "${YELLOW}This suggests migrations ran but failed to create tables${NC}"
        echo ""
        echo -e "${YELLOW}Step 3: Clearing migrations table to force re-run...${NC}"
        sudo docker exec goknown-postgres psql -U root -d defaultdb -c "TRUNCATE TABLE migrations;" 2>/dev/null
        echo -e "${GREEN}✓ Migrations table cleared${NC}"
        echo ""
    fi
else
    echo "Migrations table does not exist (this is normal for a fresh database)"
    echo ""
fi

echo -e "${YELLOW}Step 4: Running TypeORM migrations...${NC}"
echo -e "${BLUE}This may take a minute...${NC}"
echo ""

# Run migrations in the backend container
sudo docker exec goknown-backend sh -c "cd /app && yarn typeorm migration:run" 2>&1

MIGRATION_EXIT=$?
echo ""

if [ $MIGRATION_EXIT -eq 0 ]; then
    echo -e "${GREEN}✓ Migrations command completed${NC}"
    echo ""
    
    echo -e "${YELLOW}Step 5: Verifying tables were created...${NC}"
    sleep 2
    
    USERS_TABLE_EXISTS_AFTER=$(sudo docker exec goknown-postgres psql -U root -d defaultdb -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users');" 2>/dev/null | tr -d ' ' || echo "f")
    
    if [ "$USERS_TABLE_EXISTS_AFTER" = "t" ]; then
        echo -e "${GREEN}✓ 'users' table now exists!${NC}"
        
        TABLE_COUNT=$(sudo docker exec goknown-postgres psql -U root -d defaultdb -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
        echo -e "${GREEN}✓ Database has $TABLE_COUNT tables${NC}"
    else
        echo -e "${RED}✗ 'users' table still missing${NC}"
        echo ""
        echo -e "${YELLOW}Listing all tables in database:${NC}"
        sudo docker exec goknown-postgres psql -U root -d defaultdb -c "\dt" 2>/dev/null || true
        echo ""
        echo -e "${RED}Migrations may have failed. Check the output above for errors.${NC}"
        exit 1
    fi
else
    echo -e "${RED}✗ Migrations failed with exit code $MIGRATION_EXIT${NC}"
    echo ""
    echo -e "${YELLOW}Check the output above for errors${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Database Fix Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}You can now try signing up again${NC}"
echo ""
