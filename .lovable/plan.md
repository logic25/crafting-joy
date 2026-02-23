
### 1. Database Update
I will execute a SQL command to update the `care_recipients` table. This is the single source of truth for the name shown at the top of the Dashboard ("How's Mom?") and in the Emergency records.

### 2. Coordination for Siblings
Since the app is wired to this database table, any sibling who joins your Care Circle using the access code will immediately see "Mom" as the recipient. This ensures a consistent and personalized experience for the whole family.

### Technical Details
- **Action**: Update the `name` column in the `care_recipients` table.
- **SQL Command**: 
  ```sql
  UPDATE care_recipients 
  SET name = 'Mom' 
  WHERE name = 'Maria';
  ```
- **Impact**: All components using the `useCareCircle` or `care_recipients` queries will reflect this change after the next data refresh.
