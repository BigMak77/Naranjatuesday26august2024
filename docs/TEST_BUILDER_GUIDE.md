# Test Builder Guide

## Overview

The Test Builder is a comprehensive component that enables administrators and trainers to create, edit, and manage confirmation tests that can be attached to training modules and documents. These tests help verify understanding of training materials and ensure competency.

## Features

### Test Pack Management
- **Create New Tests**: Build tests from scratch with custom questions
- **Edit Existing Tests**: Load and modify previously created tests
- **View All Tests**: Browse all existing test packs
- **Active/Inactive Status**: Control test availability

### Question Types Supported

1. **Multiple Choice (Single Answer)**
   - Users select one correct answer from multiple options
   - Minimum 2 options required
   - Exactly one option must be marked as correct

2. **Multiple Choice (Multiple Answers)**
   - Users can select multiple correct answers
   - Minimum 2 options required
   - One or more options can be marked as correct

3. **True/False**
   - Simple binary choice questions
   - Automatically creates "True" and "False" options
   - One option must be marked as correct

4. **Short Answer**
   - Users type their answer
   - Requires a correct answer to be defined
   - Case-sensitive matching (can be customized)

### Question Management Features

- **Add/Delete Questions**: Dynamically add or remove questions
- **Reorder Questions**: Move questions up or down
- **Duplicate Questions**: Copy questions to save time
- **Point Values**: Assign different point values to each question
- **Answer Options**: Add, edit, and remove answer options

## Usage

### Accessing the Test Builder

Navigate to: `/training/test-builder`

### Creating a New Test

1. **Fill in Test Details**
   - **Test Title**: Give your test a descriptive name
   - **Description**: Explain the purpose and content of the test
   - **Pass Mark (%)**: Set the minimum passing score (0-100)
   - **Time Limit**: Optional time limit in minutes
   - **Status**: Set as Active or Inactive
   - **Module**: Optionally attach to a training module

2. **Add Questions**
   - Click "Add Question" to create a new question
   - Fill in the question text
   - Select the question type
   - Set point value
   - Add and configure answer options
   - Mark correct answers

3. **Configure Answer Options**
   - For MCQ questions: Add multiple options and check the correct one(s)
   - For True/False: Mark either True or False as correct
   - For Short Answer: Enter the exact correct answer

4. **Save the Test**
   - Click "Save Test" to create the test pack
   - All questions and options are saved to the database

### Editing an Existing Test

1. Click "View Existing Tests"
2. Find your test in the list
3. Click "Edit" on the test you want to modify
4. Make your changes
5. Click "Update Test" to save changes

### Question Management

**Reordering Questions**
- Use the up/down arrow buttons to change question order
- Questions are automatically renumbered

**Duplicating Questions**
- Click the copy icon to create a duplicate
- Modify the duplicate as needed

**Deleting Questions**
- Click the trash icon to remove a question
- This action updates the database when you save

## Database Schema

The test builder integrates with the following tables:

### `question_packs`
- `id`: UUID (Primary Key)
- `title`: Text
- `description`: Text
- `pass_mark`: Integer (0-100)
- `time_limit_minutes`: Integer (nullable)
- `is_active`: Boolean
- `module_id`: UUID (Foreign Key, nullable)
- `document_id`: UUID (Foreign Key, nullable)
- `created_at`: Timestamp
- `updated_at`: Timestamp

### `questions`
- `id`: UUID (Primary Key)
- `pack_id`: UUID (Foreign Key to question_packs)
- `question_text`: Text
- `type`: Enum ('mcq_single', 'mcq_multi', 'true_false', 'short_answer')
- `points`: Integer
- `order_index`: Integer
- `correct_answer`: Text (for short answer questions)

### `question_options`
- `id`: UUID (Primary Key)
- `question_id`: UUID (Foreign Key to questions)
- `option_text`: Text
- `is_correct`: Boolean
- `order_index`: Integer

## Integration with Training Modules

Tests can be attached to training modules by:

1. Selecting a module from the "Attach to Module" dropdown
2. The test will be associated with that module in the database
3. Users completing the module can be required to pass the test

## Validation Rules

The test builder enforces these validation rules:

- Test title is required
- Test description is required
- Pass mark must be between 0 and 100
- At least one question is required
- Each question must have question text
- Each question must have points > 0
- MCQ and True/False questions must have at least 2 options
- MCQ and True/False questions must have at least one correct answer
- All options must have text
- Short answer questions must have a correct answer defined

## Best Practices

1. **Clear Question Text**: Write unambiguous questions
2. **Appropriate Point Values**: Assign points based on difficulty
3. **Balanced Options**: Ensure MCQ options are plausible
4. **Reasonable Pass Marks**: Set pass marks that reflect competency (typically 70-80%)
5. **Time Limits**: Set realistic time limits based on question count
6. **Module Association**: Link tests to relevant modules for better organization
7. **Test Before Publishing**: Always test your questions before setting status to "Active"

## Technical Implementation

### Component Structure

```
TestBuilder (Main Component)
├── Test Pack Details Form
├── Questions List
│   └── QuestionBuilder (Reusable Component)
│       ├── Question Details
│       └── Answer Options
└── Save/Update Actions
```

### Key Functions

- `addQuestion()`: Creates new question with default options
- `updateQuestion()`: Updates question properties
- `deleteQuestion()`: Removes question and reorders remaining
- `moveQuestion()`: Changes question order
- `duplicateQuestion()`: Creates copy of question
- `saveTestPack()`: Saves/updates test pack to database
- `validateTestPack()`: Ensures all required fields are valid

### State Management

The component uses React hooks for state management:
- `useState` for test pack data, questions, and UI state
- `useEffect` for loading modules and existing tests
- Local state for form inputs and validation

## Troubleshooting

**Test won't save**
- Check validation errors displayed at the top
- Ensure all required fields are filled
- Verify at least one correct answer is marked per question

**Questions not displaying in correct order**
- Use the move up/down buttons
- Order is saved with the test pack

**Options not saving**
- Ensure all option text fields are filled
- Check that at least one option is marked as correct

**Module not appearing in dropdown**
- Only non-archived modules are shown
- Check module status in Module Manager

## Future Enhancements

Potential improvements for future versions:

- [ ] Question bank/library for reuse across tests
- [ ] Randomization of question and option order
- [ ] Image support in questions and answers
- [ ] Explanation text for correct/incorrect answers
- [ ] Question categories and tags
- [ ] Import/export test packs
- [ ] Preview mode before publishing
- [ ] Analytics on question difficulty
- [ ] Partial credit for multiple choice questions

## Support

For issues or feature requests related to the Test Builder, please contact your system administrator or development team.
