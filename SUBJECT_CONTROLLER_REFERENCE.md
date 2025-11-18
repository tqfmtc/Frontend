# Subject Controller - getByCenter Function

## Complete Implementation

```javascript
export const getByCenter = async (req, res) => {
    try {
        const { id, centerId } = req.params;
        
        const subject = await Subject.findById(id).populate({
            path: 'students',
            match: { assignedCenter: centerId },
            select: 'name email phone assignedCenter'
        });

        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        return res.status(200).json(subject);
    } catch (error) {
        console.error('Error fetching subject by center:', error);
        return res.status(500).json({ 
            message: 'Error fetching subject', 
            error: error.message 
        });
    }
};
```

## Explanation

1. **Destructure Parameters**: Extract `id` (subject ID) and `centerId` from route params
2. **Find Subject**: Use `Subject.findById(id)` to find the subject
3. **Populate with Match Filter**: 
   - `path: 'students'` - specifies which field to populate
   - `match: { assignedCenter: centerId }` - filters students to only those belonging to the specified center
   - `select` - specifies which student fields to return (name, email, phone, assignedCenter)
4. **Error Handling**: 
   - Return 404 if subject not found
   - Return 500 for server errors
5. **Response**: Return the subject with filtered student list

## Usage in Frontend

### 1. When viewing students for a subject (by clicking card):
```javascript
const tutorData = JSON.parse(localStorage.getItem('userData'));
const centerId = tutorData.assignedCenter._id; // or assignedCenter id

const response = await fetch(
  `${import.meta.env.VITE_API_URL}/subjects/${subjectId}/${centerId}`,
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
);
const subjectData = await response.json();
// subjectData.students will only contain students from that center enrolled in the subject
```

### 2. When adding students to a subject:
Use the same endpoint to fetch enrolled students and show them as already selected in the modal.

## Route Setup

Add this to your routes file (e.g., routes/subject.js):

```javascript
router.get('/subjects/:id/:centerId', getByCenter);
```

This should be placed BEFORE the generic `/subjects/:id` route to avoid conflicts.
