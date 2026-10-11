# Quiz and Photo Tasks for Testing

## Instructions

You can add these tasks manually through the Firebase Console:
1. Go to https://console.firebase.google.com/project/urban-rally-app/firestore
2. Navigate to the `tasks` collection
3. Click "Add document"
4. Use auto-ID and copy the fields from below

Or run this script with proper Firebase Admin SDK authentication.

---

## Photo Tasks (5 tasks)

### 1. Find a Red Door
```json
{
  "tenantId": "esn-berlin",
  "eventId": "winter-scavenger-hunt",
  "title": "Find a Red Door",
  "description": "Take a photo of a red door in your neighborhood",
  "type": "PHOTO",
  "points": 50,
  "difficulty": "easy",
  "requiresPhoto": true,
  "requiresVideo": false,
  "requiresText": false,
  "isActive": true,
  "order": 10,
  "createdAt": "[TIMESTAMP]",
  "updatedAt": "[TIMESTAMP]"
}
```

### 2. Street Art Discovery
```json
{
  "tenantId": "esn-berlin",
  "eventId": "winter-scavenger-hunt",
  "title": "Street Art Discovery",
  "description": "Find and photograph interesting street art or graffiti",
  "type": "PHOTO",
  "points": 75,
  "difficulty": "medium",
  "requiresPhoto": true,
  "requiresVideo": false,
  "requiresText": false,
  "isActive": true,
  "order": 11,
  "createdAt": "[TIMESTAMP]",
  "updatedAt": "[TIMESTAMP]"
}
```

### 3. Team Selfie Challenge
```json
{
  "tenantId": "esn-berlin",
  "eventId": "winter-scavenger-hunt",
  "title": "Team Selfie Challenge",
  "description": "Take a creative team selfie with all members",
  "type": "PHOTO",
  "points": 100,
  "difficulty": "easy",
  "requiresPhoto": true,
  "requiresVideo": false,
  "requiresText": false,
  "isActive": true,
  "order": 12,
  "createdAt": "[TIMESTAMP]",
  "updatedAt": "[TIMESTAMP]"
}
```

### 4. Historic Landmark
```json
{
  "tenantId": "esn-berlin",
  "eventId": "winter-scavenger-hunt",
  "title": "Historic Landmark",
  "description": "Find and photograph a historic building or monument",
  "type": "PHOTO",
  "points": 80,
  "difficulty": "medium",
  "requiresPhoto": true,
  "requiresVideo": false,
  "requiresText": false,
  "isActive": true,
  "order": 13,
  "createdAt": "[TIMESTAMP]",
  "updatedAt": "[TIMESTAMP]"
}
```

### 5. Public Transport Photo
```json
{
  "tenantId": "esn-berlin",
  "eventId": "winter-scavenger-hunt",
  "title": "Public Transport Photo",
  "description": "Take a photo inside a U-Bahn or S-Bahn train",
  "type": "PHOTO",
  "points": 60,
  "difficulty": "easy",
  "requiresPhoto": true,
  "requiresVideo": false,
  "requiresText": false,
  "isActive": true,
  "order": 14,
  "createdAt": "[TIMESTAMP]",
  "updatedAt": "[TIMESTAMP]"
}
```

---

## Quiz Tasks - Multiple Choice (3 tasks)

### 6. Berlin Trivia: Brandenburg Gate
```json
{
  "tenantId": "esn-berlin",
  "eventId": "winter-scavenger-hunt",
  "title": "Berlin Trivia: Brandenburg Gate",
  "description": "In which year was the Brandenburg Gate completed?",
  "type": "QUIZ",
  "quizType": "multiple-choice",
  "quizOptions": ["1781", "1791", "1801", "1811"],
  "quizCorrectAnswer": "1791",
  "quizHint": "It was completed in the late 18th century",
  "points": 50,
  "difficulty": "medium",
  "requiresPhoto": false,
  "requiresVideo": false,
  "requiresText": true,
  "isActive": true,
  "order": 20,
  "createdAt": "[TIMESTAMP]",
  "updatedAt": "[TIMESTAMP]"
}
```

### 7. Geography Quiz
```json
{
  "tenantId": "esn-berlin",
  "eventId": "winter-scavenger-hunt",
  "title": "Geography Quiz",
  "description": "Which river flows through Berlin?",
  "type": "QUIZ",
  "quizType": "multiple-choice",
  "quizOptions": ["Rhine", "Spree", "Danube", "Elbe"],
  "quizCorrectAnswer": "Spree",
  "quizHint": "It's a 4-letter word starting with S",
  "points": 40,
  "difficulty": "easy",
  "requiresPhoto": false,
  "requiresVideo": false,
  "requiresText": true,
  "isActive": true,
  "order": 21,
  "createdAt": "[TIMESTAMP]",
  "updatedAt": "[TIMESTAMP]"
}
```

### 8. ESN Knowledge
```json
{
  "tenantId": "esn-berlin",
  "eventId": "winter-scavenger-hunt",
  "title": "ESN Knowledge",
  "description": "What does ESN stand for?",
  "type": "QUIZ",
  "quizType": "multiple-choice",
  "quizOptions": [
    "European Student Network",
    "Erasmus Student Network",
    "Exchange Student Network",
    "Educational Student Network"
  ],
  "quizCorrectAnswer": "Erasmus Student Network",
  "points": 30,
  "difficulty": "easy",
  "requiresPhoto": false,
  "requiresVideo": false,
  "requiresText": true,
  "isActive": true,
  "order": 22,
  "createdAt": "[TIMESTAMP]",
  "updatedAt": "[TIMESTAMP]"
}
```

---

## Quiz Tasks - Text Answer (3 tasks)

### 9. Capital City Quiz
```json
{
  "tenantId": "esn-berlin",
  "eventId": "winter-scavenger-hunt",
  "title": "Capital City Quiz",
  "description": "What is the capital city of Germany?",
  "type": "QUIZ",
  "quizType": "text",
  "quizCorrectAnswer": "Berlin",
  "quizHint": "It's the city you're in right now!",
  "points": 25,
  "difficulty": "easy",
  "requiresPhoto": false,
  "requiresVideo": false,
  "requiresText": true,
  "isActive": true,
  "order": 23,
  "createdAt": "[TIMESTAMP]",
  "updatedAt": "[TIMESTAMP]"
}
```

### 10. Movie Trivia
```json
{
  "tenantId": "esn-berlin",
  "eventId": "winter-scavenger-hunt",
  "title": "Movie Trivia",
  "description": "Name the famous spy movie series filmed in Berlin featuring Matt Damon.",
  "type": "QUIZ",
  "quizType": "text",
  "quizCorrectAnswer": "Bourne",
  "quizHint": "The Bourne ________",
  "points": 60,
  "difficulty": "medium",
  "requiresPhoto": false,
  "requiresVideo": false,
  "requiresText": true,
  "isActive": true,
  "order": 24,
  "createdAt": "[TIMESTAMP]",
  "updatedAt": "[TIMESTAMP]"
}
```

### 11. Food Challenge
```json
{
  "tenantId": "esn-berlin",
  "eventId": "winter-scavenger-hunt",
  "title": "Food Challenge",
  "description": "What is the traditional Berlin street food made with curry sauce?",
  "type": "QUIZ",
  "quizType": "text",
  "quizCorrectAnswer": "Currywurst",
  "quizHint": "Curry + German sausage",
  "points": 35,
  "difficulty": "easy",
  "requiresPhoto": false,
  "requiresVideo": false,
  "requiresText": true,
  "isActive": true,
  "order": 27,
  "createdAt": "[TIMESTAMP]",
  "updatedAt": "[TIMESTAMP]"
}
```

---

## Quiz Tasks - Number Answer (2 tasks)

### 12. Math Challenge
```json
{
  "tenantId": "esn-berlin",
  "eventId": "winter-scavenger-hunt",
  "title": "Math Challenge",
  "description": "How many sections was Berlin divided into after WWII?",
  "type": "QUIZ",
  "quizType": "number",
  "quizCorrectAnswer": 4,
  "quizHint": "Think about the Allied powers",
  "points": 45,
  "difficulty": "medium",
  "requiresPhoto": false,
  "requiresVideo": false,
  "requiresText": true,
  "isActive": true,
  "order": 25,
  "createdAt": "[TIMESTAMP]",
  "updatedAt": "[TIMESTAMP]"
}
```

### 13. Year Challenge
```json
{
  "tenantId": "esn-berlin",
  "eventId": "winter-scavenger-hunt",
  "title": "Year Challenge",
  "description": "In what year did the Berlin Wall fall?",
  "type": "QUIZ",
  "quizType": "number",
  "quizCorrectAnswer": 1989,
  "quizHint": "Late 1980s",
  "points": 50,
  "difficulty": "medium",
  "requiresPhoto": false,
  "requiresVideo": false,
  "requiresText": true,
  "isActive": true,
  "order": 26,
  "createdAt": "[TIMESTAMP]",
  "updatedAt": "[TIMESTAMP]"
}
```

---

## Summary

**Total Tasks: 13**
- 📸 Photo tasks: 5
- ❓ Quiz tasks: 8
  - Multiple choice: 3
  - Text answer: 3
  - Number answer: 2

**Points Distribution:**
- Easy (25-60 pts): 7 tasks
- Medium (60-100 pts): 6 tasks

**Testing Coverage:**
- Tests all quiz types (multiple-choice, text, number)
- Tests photo capture functionality
- Tests hints display
- Tests point awards based on correctness
- Varied difficulty levels for comprehensive testing
