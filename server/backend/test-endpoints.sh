#!/bin/bash

# Test script for Part 1 CMS API endpoints
# Run this after the server is running on http://localhost:8000

BASE_URL="http://localhost:8000/api"
COOKIE_FILE="test-cookies.txt"

echo "========================================="
echo "Testing AI-Powered Learning Platform API"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Sign up as admin
echo -e "${YELLOW}Test 1: Sign Up Admin${NC}"
SIGNUP_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testadmin@bracu.ac.bd",
    "password": "AdminPass123",
    "full_name": "Test Admin",
    "role": "admin",
    "department_id": "11111111-1111-1111-1111-111111111111"
  }')

echo "$SIGNUP_RESPONSE" | jq '.'
echo ""

# Test 2: Sign in as admin
echo -e "${YELLOW}Test 2: Sign In Admin${NC}"
SIGNIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/signin" \
  -H "Content-Type: application/json" \
  -c "$COOKIE_FILE" \
  -d '{
    "email": "testadmin@bracu.ac.bd",
    "password": "AdminPass123"
  }')

echo "$SIGNIN_RESPONSE" | jq '.'

# Extract token from response
TOKEN=$(echo "$SIGNIN_RESPONSE" | jq -r '.data.accessToken')
echo -e "${GREEN}Token: $TOKEN${NC}"
echo ""

# Test 3: Create a course (admin only)
echo -e "${YELLOW}Test 3: Create Course (Admin)${NC}"
CREATE_COURSE_RESPONSE=$(curl -s -X POST "$BASE_URL/courses" \
  -b "$COOKIE_FILE" \
  -H "Content-Type: application/json" \
  -d '{
    "course_code": "CSE220",
    "course_name": "Data Structures",
    "department_id": "11111111-1111-1111-1111-111111111111",
    "semester": "Fall",
    "year": 2024,
    "description": "Introduction to data structures and algorithms"
  }')

echo "$CREATE_COURSE_RESPONSE" | jq '.'
COURSE_ID=$(echo "$CREATE_COURSE_RESPONSE" | jq -r '.data.course_id')
echo -e "${GREEN}Course ID: $COURSE_ID${NC}"
echo ""

# Test 4: Get all courses
echo -e "${YELLOW}Test 4: Get All Courses${NC}"
GET_COURSES_RESPONSE=$(curl -s -X GET "$BASE_URL/courses")
echo "$GET_COURSES_RESPONSE" | jq '.'
echo ""

# Test 5: Get course by ID
echo -e "${YELLOW}Test 5: Get Course by ID${NC}"
GET_COURSE_RESPONSE=$(curl -s -X GET "$BASE_URL/courses/$COURSE_ID")
echo "$GET_COURSE_RESPONSE" | jq '.'
echo ""

# Test 6: Sign up as student
echo -e "${YELLOW}Test 6: Sign Up Student${NC}"
STUDENT_SIGNUP=$(curl -s -X POST "$BASE_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teststudent@bracu.ac.bd",
    "password": "StudentPass123",
    "full_name": "Test Student",
    "role": "student",
    "department_id": "11111111-1111-1111-1111-111111111111"
  }')

echo "$STUDENT_SIGNUP" | jq '.'
STUDENT_TOKEN=$(echo "$STUDENT_SIGNUP" | jq -r '.data.accessToken')
echo ""

# Test 7: Enroll in course as student
echo -e "${YELLOW}Test 7: Enroll in Course (Student)${NC}"
ENROLL_RESPONSE=$(curl -s -X POST "$BASE_URL/courses/$COURSE_ID/enroll" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json")

echo "$ENROLL_RESPONSE" | jq '.'
echo ""

# Test 8: Get enrolled courses
echo -e "${YELLOW}Test 8: Get My Enrolled Courses${NC}"
MY_COURSES=$(curl -s -X GET "$BASE_URL/courses/my/enrollments" \
  -H "Authorization: Bearer $STUDENT_TOKEN")

echo "$MY_COURSES" | jq '.'
echo ""

# Note: File upload test requires actual file
echo -e "${YELLOW}Test 9: Upload Material (Skipped - requires actual file)${NC}"
echo "To test file upload, use:"
echo "curl -X POST $BASE_URL/materials/upload \\"
echo "  -b $COOKIE_FILE \\"
echo "  -F \"file=@your-file.pdf\" \\"
echo "  -F \"course_id=$COURSE_ID\" \\"
echo "  -F \"material_type=slides\" \\"
echo "  -F \"category=theory\" \\"
echo "  -F \"title=Test Lecture\" \\"
echo "  -F \"week_number=1\""
echo ""

# Test 10: Get all materials (should be empty initially)
echo -e "${YELLOW}Test 10: Get All Materials${NC}"
GET_MATERIALS=$(curl -s -X GET "$BASE_URL/materials?course_id=$COURSE_ID")
echo "$GET_MATERIALS" | jq '.'
echo ""

# Test 11: Browse by category
echo -e "${YELLOW}Test 11: Browse Theory Materials${NC}"
BROWSE_THEORY=$(curl -s -X GET "$BASE_URL/materials/browse/theory?course_id=$COURSE_ID")
echo "$BROWSE_THEORY" | jq '.'
echo ""

# Cleanup
echo -e "${YELLOW}Cleaning up test cookies...${NC}"
rm -f "$COOKIE_FILE"

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Testing Complete!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Summary:"
echo "- Admin account created: testadmin@bracu.ac.bd"
echo "- Student account created: teststudent@bracu.ac.bd"
echo "- Course created: CSE220 (ID: $COURSE_ID)"
echo "- Student enrolled in course"
echo ""
echo "You can now test file uploads manually or continue testing in Postman/Insomnia."
